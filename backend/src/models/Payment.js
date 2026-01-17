const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true
  },
  orderId: {
    type: DataTypes.STRING(64),
    allowNull: false,
    field: 'order_id'
  },
  merchantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'merchant_id'
  },
  amount: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR'
  },
  method: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  vpa: {
    type: DataTypes.STRING(255)
  },
  cardNumber: {
    type: DataTypes.STRING(19),
    field: 'card_number'
  },
  cardExpiry: {
    type: DataTypes.STRING(7),
    field: 'card_expiry'
  },
  cardCvv: {
    type: DataTypes.STRING(4),
    field: 'card_cvv'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending'
  },
  errorCode: {
    type: DataTypes.STRING(50),
    field: 'error_code'
  },
  errorDescription: {
    type: DataTypes.TEXT,
    field: 'error_description'
  },
  captured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'payments',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['order_id'] },
    { fields: ['merchant_id'] }
  ]
});

module.exports = Payment;
