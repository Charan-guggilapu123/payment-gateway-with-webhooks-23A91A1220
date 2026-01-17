const express = require('express');
const { nanoid } = require('nanoid');
const { Refund, Payment } = require('../models');
const { sequelize } = require('../models');
const { enqueueJob } = require('../queues');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Create Refund
router.post('/payments/:paymentId/refunds', authenticate, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const { paymentId } = req.params;
    
    // Validate payment
    const payment = await Payment.findOne({
      where: {
        id: paymentId,
        merchantId: req.merchant.id
      }
    });
    
    if (!payment) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          description: 'Payment not found'
        }
      });
    }
    
    if (payment.status !== 'success') {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'Payment not in refundable state'
        }
      });
    }
    
    // Calculate total refunded amount
    const result = await Refund.findAll({
      where: { paymentId },
      attributes: [
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('amount')), 0), 'total']
      ],
      raw: true
    });
    
    const totalRefunded = parseInt(result[0].total) || 0;
    const availableAmount = payment.amount - totalRefunded;
    
    if (amount > availableAmount) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'Refund amount exceeds available amount'
        }
      });
    }
    
    // Create refund
    const refundId = `rfnd_${nanoid(16)}`;
    
    const refund = await Refund.create({
      id: refundId,
      paymentId,
      merchantId: req.merchant.id,
      amount,
      reason,
      status: 'pending'
    });
    
    // Enqueue refund processing job
    await enqueueJob('ProcessRefundJob', { refundId });
    
    res.status(201).json({
      id: refund.id,
      payment_id: refund.paymentId,
      amount: refund.amount,
      reason: refund.reason,
      status: refund.status,
      created_at: refund.createdAt.toISOString()
    });
  } catch (error) {
    console.error('Create refund error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to create refund'
      }
    });
  }
});

// Get Refund
router.get('/refunds/:refundId', authenticate, async (req, res) => {
  try {
    const refund = await Refund.findOne({
      where: {
        id: req.params.refundId,
        merchantId: req.merchant.id
      }
    });
    
    if (!refund) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          description: 'Refund not found'
        }
      });
    }
    
    const response = {
      id: refund.id,
      payment_id: refund.paymentId,
      amount: refund.amount,
      reason: refund.reason,
      status: refund.status,
      created_at: refund.createdAt.toISOString(),
      ...(refund.processedAt && { processed_at: refund.processedAt.toISOString() })
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get refund error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to get refund'
      }
    });
  }
});

module.exports = router;
