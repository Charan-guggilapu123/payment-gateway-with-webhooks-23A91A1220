const express = require('express');
const { WebhookLog } = require('../models');
const { enqueueJob } = require('../queues');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// List Webhook Logs
router.get('/', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    const { count, rows: webhooks } = await WebhookLog.findAndCountAll({
      where: { merchantId: req.merchant.id },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    const webhookList = webhooks.map(webhook => ({
      id: webhook.id,
      event: webhook.event,
      status: webhook.status,
      attempts: webhook.attempts,
      created_at: webhook.createdAt.toISOString(),
      ...(webhook.lastAttemptAt && { last_attempt_at: webhook.lastAttemptAt.toISOString() }),
      ...(webhook.responseCode && { response_code: webhook.responseCode })
    }));
    
    res.json({
      data: webhookList,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('List webhooks error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to list webhooks'
      }
    });
  }
});

// Retry Webhook
router.post('/:webhookId/retry', authenticate, async (req, res) => {
  try {
    const webhook = await WebhookLog.findOne({
      where: {
        id: req.params.webhookId,
        merchantId: req.merchant.id
      }
    });
    
    if (!webhook) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          description: 'Webhook not found'
        }
      });
    }
    
    // Reset attempts and status
    webhook.attempts = 0;
    webhook.status = 'pending';
    webhook.nextRetryAt = null;
    await webhook.save();
    
    // Enqueue webhook job
    await enqueueJob('DeliverWebhookJob', { webhookLogId: webhook.id });
    
    res.json({
      id: webhook.id,
      status: 'pending',
      message: 'Webhook retry scheduled'
    });
  } catch (error) {
    console.error('Retry webhook error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to retry webhook'
      }
    });
  }
});

module.exports = router;
