const { Payment, Merchant, WebhookLog } = require('../models');
const { enqueueJob } = require('../queues');

const TEST_MODE = process.env.TEST_MODE === 'true';
const TEST_PROCESSING_DELAY = parseInt(process.env.TEST_PROCESSING_DELAY || '1000');
const TEST_PAYMENT_SUCCESS = process.env.TEST_PAYMENT_SUCCESS !== 'false';

const processPaymentWorker = async (job) => {
  const { paymentId } = job.data;
  
  console.log(`Processing payment: ${paymentId}`);
  
  try {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      console.error(`Payment not found: ${paymentId}`);
      return;
    }
    
    // Simulate processing delay
    if (TEST_MODE) {
      await new Promise(resolve => setTimeout(resolve, TEST_PROCESSING_DELAY));
    } else {
      const delay = 5000 + Math.random() * 5000; // 5-10 seconds
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Determine payment outcome
    let success;
    if (TEST_MODE) {
      success = TEST_PAYMENT_SUCCESS;
    } else {
      const successRate = payment.method === 'upi' ? 0.9 : 0.95;
      success = Math.random() < successRate;
    }
    
    // Update payment status
    if (success) {
      payment.status = 'success';
      await payment.save();
      console.log(`Payment succeeded: ${paymentId}`);
    } else {
      payment.status = 'failed';
      payment.errorCode = 'PAYMENT_FAILED';
      payment.errorDescription = 'Payment processing failed';
      await payment.save();
      console.log(`Payment failed: ${paymentId}`);
    }
    
    // Enqueue webhook
    const merchant = await Merchant.findByPk(payment.merchantId);
    if (merchant && merchant.webhookUrl) {
      const event = success ? 'payment.success' : 'payment.failed';
      await enqueueWebhook(merchant.id, event, payment);
    }
  } catch (error) {
    console.error(`Error processing payment ${paymentId}:`, error);
    throw error;
  }
};

const enqueueWebhook = async (merchantId, event, payment) => {
  const payload = {
    event,
    timestamp: Math.floor(Date.now() / 1000),
    data: {
      payment: {
        id: payment.id,
        order_id: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        ...(payment.vpa && { vpa: payment.vpa }),
        status: payment.status,
        created_at: payment.createdAt.toISOString()
      }
    }
  };
  
  const webhookLog = await WebhookLog.create({
    merchantId,
    event,
    payload,
    status: 'pending',
    attempts: 0
  });
  
  await enqueueJob('DeliverWebhookJob', {
    webhookLogId: webhookLog.id
  });
};

module.exports = processPaymentWorker;
