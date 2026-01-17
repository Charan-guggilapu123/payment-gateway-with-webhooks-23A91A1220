const express = require('express');
const { nanoid } = require('nanoid');
const { Payment, Order, IdempotencyKey } = require('../models');
const { enqueueJob } = require('../queues');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Create Payment
router.post('/', authenticate, async (req, res) => {
  try {
    const { order_id, method, vpa, card_number, card_expiry, card_cvv } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];
    
    // Check idempotency key
    if (idempotencyKey) {
      const existingKey = await IdempotencyKey.findOne({
        where: {
          key: idempotencyKey,
          merchantId: req.merchant.id
        }
      });
      
      if (existingKey) {
        if (new Date(existingKey.expiresAt) > new Date()) {
          return res.status(201).json(existingKey.response);
        } else {
          await existingKey.destroy();
        }
      }
    }
    
    // Validate order
    const order = await Order.findOne({
      where: {
        id: order_id,
        merchantId: req.merchant.id
      }
    });
    
    if (!order) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'Invalid order ID'
        }
      });
    }
    
    // Create payment
    const paymentId = `pay_${nanoid(16)}`;
    
    const payment = await Payment.create({
      id: paymentId,
      orderId: order.id,
      merchantId: req.merchant.id,
      amount: order.amount,
      currency: order.currency,
      method,
      vpa,
      cardNumber: card_number,
      cardExpiry: card_expiry,
      cardCvv: card_cvv,
      status: 'pending',
      captured: false
    });
    
    // Enqueue payment processing job
    await enqueueJob('ProcessPaymentJob', { paymentId });
    
    // Build response
    const response = {
      id: payment.id,
      order_id: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      ...(payment.vpa && { vpa: payment.vpa }),
      status: payment.status,
      created_at: payment.created_at
    };
    
    // Store idempotency key
    if (idempotencyKey) {
      await IdempotencyKey.create({
        key: idempotencyKey,
        merchantId: req.merchant.id,
        response,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to create payment'
      }
    });
  }
});

// Get Payment
router.get('/:paymentId', authenticate, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      where: {
        id: req.params.paymentId,
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
    
    const response = {
      id: payment.id,
      order_id: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      ...(payment.vpa && { vpa: payment.vpa }),
      status: payment.status,
      captured: payment.captured,
      created_at: payment.created_at,
      ...(payment.updated_at && { updated_at: payment.updated_at }),
      ...(payment.errorCode && {
        error_code: payment.errorCode,
        error_description: payment.errorDescription
      })
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to get payment'
      }
    });
  }
});

// Capture Payment
router.post('/:paymentId/capture', authenticate, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      where: {
        id: req.params.paymentId,
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
          description: 'Payment not in capturable state'
        }
      });
    }
    
    payment.captured = true;
    await payment.save();
    
    res.json({
      id: payment.id,
      order_id: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      captured: payment.captured,
      created_at: payment.created_at,
      updated_at: payment.updated_at
    });
  } catch (error) {
    console.error('Capture payment error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to capture payment'
      }
    });
  }
});

// List Payments
router.get('/', authenticate, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { merchantId: req.merchant.id },
      order: [['created_at', 'DESC']]
    });
    
    const paymentList = payments.map(payment => ({
      id: payment.id,
      order_id: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      created_at: payment.created_at
    }));
    
    res.json({
      data: paymentList,
      total: payments.length
    });
  } catch (error) {
    console.error('List payments error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to list payments'
      }
    });
  }
});

module.exports = router;
