const { Refund, Payment, WebhookLog } = require('../models');
const { enqueueJob } = require('../queues');

const refundWorker = async (job) => {
  const { refundId } = job.data;
  
  console.log(`Processing refund: ${refundId}`);
  
  try {
    const refund = await Refund.findByPk(refundId);
    if (!refund) {
      console.error(`Refund not found: ${refundId}`);
      return;
    }
    
    const payment = await Payment.findByPk(refund.paymentId);
    if (!payment || payment.status !== 'success') {
      console.error('Payment not found or not in refundable state');
      refund.status = 'failed';
      await refund.save();
      return;
    }
    
    // Simulate refund processing delay (3-5 seconds)
    const delay = 3000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Update refund status
    refund.status = 'processed';
    refund.processedAt = new Date();
    await refund.save();
    
    console.log(`Refund processed: ${refundId}`);
    
    // Enqueue webhook
    await enqueueWebhook(refund.merchantId, refund);
  } catch (error) {
    console.error(`Error processing refund ${refundId}:`, error);
    throw error;
  }
};

const enqueueWebhook = async (merchantId, refund) => {
  const payload = {
    event: 'refund.processed',
    timestamp: Math.floor(Date.now() / 1000),
    data: {
      refund: {
        id: refund.id,
        payment_id: refund.paymentId,
        amount: refund.amount,
        reason: refund.reason,
        status: refund.status,
        created_at: refund.createdAt.toISOString(),
        processed_at: refund.processedAt.toISOString()
      }
    }
  };
  
  const webhookLog = await WebhookLog.create({
    merchantId,
    event: 'refund.processed',
    payload,
    status: 'pending',
    attempts: 0
  });
  
  await enqueueJob('DeliverWebhookJob', {
    webhookLogId: webhookLog.id
  });
};

module.exports = refundWorker;
