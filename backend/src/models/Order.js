const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true
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
  receipt: {
    type: DataTypes.STRING(255)
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'created'
  }
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['merchant_id'] }
  ]
});

module.exports = Order;
