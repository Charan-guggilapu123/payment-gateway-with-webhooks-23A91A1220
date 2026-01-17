const crypto = require('crypto');
const axios = require('axios');
const { WebhookLog, Merchant } = require('../models');
const { enqueueJob } = require('../queues');

const WEBHOOK_RETRY_INTERVALS_TEST = process.env.WEBHOOK_RETRY_INTERVALS_TEST === 'true';

// Production retry intervals in seconds
const RETRY_INTERVALS = [0, 60, 300, 1800, 7200];

// Test retry intervals in seconds
const TEST_RETRY_INTERVALS = [0, 5, 10, 15, 20];

const webhookWorker = async (job) => {
  const { webhookLogId } = job.data;
  
  console.log(`Delivering webhook: ${webhookLogId}`);
  
  try {
    const webhookLog = await WebhookLog.findByPk(webhookLogId);
    if (!webhookLog) {
      console.error(`Webhook log not found: ${webhookLogId}`);
      return;
    }
    
    const merchant = await Merchant.findByPk(webhookLog.merchantId);
    if (!merchant || !merchant.webhookUrl) {
      console.error('Merchant or webhook URL not found');
      webhookLog.status = 'failed';
      await webhookLog.save();
      return;
    }
    
    const payloadJson = JSON.stringify(webhookLog.payload);
    const signature = generateSignature(payloadJson, merchant.webhookSecret);
    
    webhookLog.attempts += 1;
    webhookLog.lastAttemptAt = new Date();
    
    try {
      const response = await axios.post(merchant.webhookUrl, webhookLog.payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature
        },
        timeout: 5000
      });
      
      webhookLog.responseCode = response.status;
      webhookLog.responseBody = JSON.stringify(response.data).substring(0, 1000);
      
      if (response.status >= 200 && response.status < 300) {
        webhookLog.status = 'success';
        console.log(`✓ Webhook delivered successfully: ${webhookLogId}`);
      } else {
        handleFailedDelivery(webhookLog);
      }
    } catch (error) {
      webhookLog.responseCode = error.response?.status || null;
      webhookLog.responseBody = error.message.substring(0, 1000);
      console.error(`✗ Webhook delivery failed for ${webhookLogId}: ${error.message}`);
      if (error.code) {
        console.error(`  Error code: ${error.code}`);
      }
      if (error.errno) {
        console.error(`  errno: ${error.errno}`);
      }
      handleFailedDelivery(webhookLog);
    }
    
    await webhookLog.save();
    
    // Schedule retry if needed
    if (webhookLog.status === 'pending' && webhookLog.nextRetryAt) {
      const delay = Math.max(0, new Date(webhookLog.nextRetryAt) - new Date());
      setTimeout(async () => {
        await enqueueJob('DeliverWebhookJob', { webhookLogId: webhookLog.id });
      }, delay);
    }
  } catch (error) {
    console.error(`Error delivering webhook ${webhookLogId}:`, error);
    throw error;
  }
};

const handleFailedDelivery = (webhookLog) => {
  if (webhookLog.attempts >= 5) {
    webhookLog.status = 'failed';
    console.error(`Webhook permanently failed after 5 attempts: ${webhookLog.id}`);
  } else {
    webhookLog.status = 'pending';
    const intervals = WEBHOOK_RETRY_INTERVALS_TEST ? TEST_RETRY_INTERVALS : RETRY_INTERVALS;
    const delaySeconds = intervals[webhookLog.attempts];
    webhookLog.nextRetryAt = new Date(Date.now() + delaySeconds * 1000);
    console.log(`Webhook will retry in ${delaySeconds} seconds (attempt ${webhookLog.attempts})`);
  }
};

const generateSignature = (payload, secret) => {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
};

module.exports = webhookWorker;
