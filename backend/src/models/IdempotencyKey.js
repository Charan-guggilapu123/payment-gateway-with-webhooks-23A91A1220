const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IdempotencyKey = sequelize.define('IdempotencyKey', {
  key: {
    type: DataTypes.STRING(255),
    primaryKey: true
  },
  merchantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'merchant_id'
  },
  response: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  }
}, {
  tableName: 'idempotency_keys',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['key', 'merchant_id']
    }
  ]
});

module.exports = IdempotencyKey;
