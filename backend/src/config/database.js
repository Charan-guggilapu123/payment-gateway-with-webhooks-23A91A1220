const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://gateway_user:gateway_pass@localhost:5432/payment_gateway', {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
