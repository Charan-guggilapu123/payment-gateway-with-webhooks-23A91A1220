const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Refund = sequelize.define('Refund', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true
  },
  paymentId: {
    type: DataTypes.STRING(64),
    allowNull: false,
    field: 'payment_id'
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
  reason: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending'
  },
  processedAt: {
    type: DataTypes.DATE,
    field: 'processed_at'
  }
}, {
  tableName: 'refunds',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['payment_id'] }
  ]
});

module.exports = Refund;
