const Bull = require('bull');
const redisClient = require('../config/redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create queues
const paymentQueue = new Bull('ProcessPaymentJob', REDIS_URL);
const webhookQueue = new Bull('DeliverWebhookJob', REDIS_URL);
const refundQueue = new Bull('ProcessRefundJob', REDIS_URL);

// Queue event handlers
[paymentQueue, webhookQueue, refundQueue].forEach(queue => {
  queue.on('error', (error) => {
    console.error(`Queue ${queue.name} error:`, error);
  });
  
  queue.on('completed', (job) => {
    console.log(`Job ${job.id} in ${queue.name} completed`);
  });
  
  queue.on('failed', (job, err) => {
    console.error(`Job ${job.id} in ${queue.name} failed:`, err.message);
  });
});

const enqueueJob = async (queueName, data) => {
  let queue;
  
  switch (queueName) {
    case 'ProcessPaymentJob':
      queue = paymentQueue;
      break;
    case 'DeliverWebhookJob':
      queue = webhookQueue;
      break;
    case 'ProcessRefundJob':
      queue = refundQueue;
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }
  
  const job = await queue.add(data, {
    attempts: 1,
    removeOnComplete: false,
    removeOnFail: false
  });
  
  console.log(`Enqueued job ${job.id} in ${queueName}`);
  return job.id;
};

const getJobStats = async () => {
  const allQueues = [paymentQueue, webhookQueue, refundQueue];
  
  let pending = 0;
  let processing = 0;
  let completed = 0;
  let failed = 0;
  
  for (const queue of allQueues) {
    const counts = await queue.getJobCounts();
    pending += counts.waiting + counts.delayed;
    processing += counts.active;
    completed += counts.completed;
    failed += counts.failed;
  }
  
  return {
    pending,
    processing,
    completed,
    failed,
    worker_status: 'running'
  };
};

module.exports = {
  paymentQueue,
  webhookQueue,
  refundQueue,
  enqueueJob,
  getJobStats
};
