const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Merchant = sequelize.define('Merchant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  apiKey: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
    field: 'api_key'
  },
  apiSecret: {
    type: DataTypes.STRING(64),
    allowNull: false,
    field: 'api_secret'
  },
  webhookUrl: {
    type: DataTypes.STRING(500),
    field: 'webhook_url'
  },
  webhookSecret: {
    type: DataTypes.STRING(64),
    field: 'webhook_secret'
  }
}, {
  tableName: 'merchants',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['api_key'] }
  ]
});

module.exports = Merchant;
