const sequelize = require('../config/database');
const Merchant = require('./Merchant');
const Order = require('./Order');
const Payment = require('./Payment');
const Refund = require('./Refund');
const WebhookLog = require('./WebhookLog');
const IdempotencyKey = require('./IdempotencyKey');

// Define associations
Merchant.hasMany(Order, { foreignKey: 'merchantId' });
Order.belongsTo(Merchant, { foreignKey: 'merchantId' });

Merchant.hasMany(Payment, { foreignKey: 'merchantId' });
Payment.belongsTo(Merchant, { foreignKey: 'merchantId' });
Payment.belongsTo(Order, { foreignKey: 'orderId' });

Merchant.hasMany(Refund, { foreignKey: 'merchantId' });
Refund.belongsTo(Merchant, { foreignKey: 'merchantId' });
Refund.belongsTo(Payment, { foreignKey: 'paymentId' });

Merchant.hasMany(WebhookLog, { foreignKey: 'merchantId' });
WebhookLog.belongsTo(Merchant, { foreignKey: 'merchantId' });

Merchant.hasMany(IdempotencyKey, { foreignKey: 'merchantId' });
IdempotencyKey.belongsTo(Merchant, { foreignKey: 'merchantId' });

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');
    
    await sequelize.sync({ alter: true });
    console.log('✓ Database synchronized');
    
    // Create test merchant
    const testMerchant = await Merchant.findOne({ where: { email: 'test@example.com' } });
    if (!testMerchant) {
      await Merchant.create({
        name: 'Test Merchant',
        email: 'test@example.com',
        apiKey: 'key_test_abc123',
        apiSecret: 'secret_test_xyz789',
        webhookSecret: 'whsec_test_abc123'
      });
      console.log('✓ Test merchant created');
    }
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  Merchant,
  Order,
  Payment,
  Refund,
  WebhookLog,
  IdempotencyKey,
  syncDatabase
};
