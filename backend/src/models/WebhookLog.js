const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WebhookLog = sequelize.define('WebhookLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  merchantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'merchant_id'
  },
  event: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  payload: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending'
  },
  attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  lastAttemptAt: {
    type: DataTypes.DATE,
    field: 'last_attempt_at'
  },
  nextRetryAt: {
    type: DataTypes.DATE,
    field: 'next_retry_at'
  },
  responseCode: {
    type: DataTypes.INTEGER,
    field: 'response_code'
  },
  responseBody: {
    type: DataTypes.TEXT,
    field: 'response_body'
  }
}, {
  tableName: 'webhook_logs',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['merchant_id'] },
    { fields: ['status'] },
    { fields: ['next_retry_at', 'status'] }
  ]
});

module.exports = WebhookLog;
