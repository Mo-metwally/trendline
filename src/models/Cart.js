const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  cart_token: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  user_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'converted', 'abandoned'),
    allowNull: false,
    defaultValue: 'active',
  },
}, {
  tableName: 'carts',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['cart_token'] },
    { fields: ['user_id'] },
    { fields: ['status'] },
  ],
});

module.exports = Cart;
