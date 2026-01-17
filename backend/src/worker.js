require('dotenv').config();
const redisClient = require('./config/redis');
const { syncDatabase } = require('./models');
const { paymentQueue, webhookQueue, refundQueue } = require('./queues');

const paymentWorker = require('./workers/paymentWorker');
const webhookWorker = require('./workers/webhookWorker');
const refundWorker = require('./workers/refundWorker');

const startWorker = async () => {
  try {
    // Connect to Redis
    await redisClient.connect();
    
    // Sync database
    await syncDatabase();
    
    console.log('✓ Worker service starting...');
    
    // Process payment jobs
    paymentQueue.process(async (job) => {
      await paymentWorker(job);
    });
    
    // Process webhook jobs
    webhookQueue.process(async (job) => {
      await webhookWorker(job);
    });
    
    // Process refund jobs
    refundQueue.process(async (job) => {
      await refundWorker(job);
    });
    
    console.log('✓ Worker service started successfully');
    console.log('✓ Listening for jobs on: ProcessPaymentJob, DeliverWebhookJob, ProcessRefundJob');
  } catch (error) {
    console.error('Failed to start worker:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await paymentQueue.close();
  await webhookQueue.close();
  await refundQueue.close();
  await redisClient.quit();
  process.exit(0);
});

startWorker();
