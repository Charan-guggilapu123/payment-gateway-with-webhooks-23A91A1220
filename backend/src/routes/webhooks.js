const express = require('express');
const { WebhookLog, Merchant } = require('../models');
const { enqueueJob } = require('../queues');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Get webhook configuration
router.get('/config', authenticate, async (req, res) => {
  try {
    const merchant = req.merchant;
    
    res.json({
      success: true,
      data: {
        url: merchant.webhookUrl || '',
        secret: merchant.webhookSecret || ''
      }
    });
  } catch (error) {
    console.error('Get webhook config error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to get webhook configuration'
      }
    });
  }
});

// Save webhook configuration
router.post('/config', authenticate, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          description: 'Webhook URL is required'
        }
      });
    }
    
    // Update merchant webhook URL
    const merchant = req.merchant;
    merchant.webhookUrl = url;
    await merchant.save();
    
    res.json({
      success: true,
      message: 'Webhook configuration saved',
      data: {
        url: merchant.webhookUrl,
        secret: merchant.webhookSecret
      }
    });
  } catch (error) {
    console.error('Save webhook config error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to save webhook configuration'
      }
    });
  }
});

// List Webhook Logs
router.get('/', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    const { count, rows: webhooks } = await WebhookLog.findAndCountAll({
      where: { merchantId: req.merchant.id },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    const webhookList = webhooks.map(webhook => ({
      id: webhook.id,
      event: webhook.event,
      status: webhook.status,
      attempts: webhook.attempts,
      created_at: webhook.created_at,
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

// Send Test Webhook
router.post('/test', authenticate, async (req, res) => {
  try {
    const { url, payload } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          description: 'Webhook URL is required'
        }
      });
    }
    
    // Create a test webhook log entry
    const webhookLog = await WebhookLog.create({
      merchantId: req.merchant.id,
      event: payload?.event || 'test.webhook',
      url: url,
      // Store as JSON object (matches JSONB column and signature generation)
      payload: payload || { test: true },
      status: 'pending',
      attempts: 0
    });
    
    // Enqueue webhook delivery job
    await enqueueJob('DeliverWebhookJob', { webhookLogId: webhookLog.id });
    
    res.json({
      success: true,
      message: 'Test webhook sent',
      data: {
        id: webhookLog.id,
        event: webhookLog.event,
        url: webhookLog.url,
        status: webhookLog.status
      }
    });
  } catch (error) {
    console.error('Send test webhook error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to send test webhook'
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
