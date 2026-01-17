const express = require('express');
const { nanoid } = require('nanoid');
const { Order } = require('../models');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Create Order
router.post('/', authenticate, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    
    const orderId = `order_${nanoid(16)}`;
    
    const order = await Order.create({
      id: orderId,
      merchantId: req.merchant.id,
      amount,
      currency,
      receipt,
      status: 'created'
    });
    
    res.status(201).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      created_at: order.createdAt.toISOString()
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to create order'
      }
    });
  }
});

// Get Order
router.get('/:orderId', authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: {
        id: req.params.orderId,
        merchantId: req.merchant.id
      }
    });
    
    if (!order) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          description: 'Order not found'
        }
      });
    }
    
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      created_at: order.createdAt.toISOString()
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to get order'
      }
    });
  }
});

// List Orders
router.get('/', authenticate, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { merchantId: req.merchant.id },
      order: [['createdAt', 'DESC']]
    });
    
    const orderList = orders.map(order => ({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      created_at: order.createdAt.toISOString()
    }));
    
    res.json({
      data: orderList,
      total: orders.length
    });
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to list orders'
      }
    });
  }
});

module.exports = router;
