require('dotenv').config();
const express = require('express');
const cors = require('cors');
const redisClient = require('./config/redis');
const { syncDatabase } = require('./models');

// Routes
const ordersRouter = require('./routes/orders');
const paymentsRouter = require('./routes/payments');
const refundsRouter = require('./routes/refunds');
const webhooksRouter = require('./routes/webhooks');
const testRouter = require('./routes/test');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1', refundsRouter);
app.use('/api/v1/webhooks', webhooksRouter);
app.use('/api/v1/test', testRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      description: 'An unexpected error occurred'
    }
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    await redisClient.connect();
    
    // Sync database
    await syncDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
