const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrderReturn = sequelize.define('OrderReturn', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  rma_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  order_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  status: {
    type: DataTypes.ENUM(
      'requested',
      'approved',
      'rejected',
      'received_in_warehouse',
      'inspected',
      'refunded'
    ),
    allowNull: false,
    defaultValue: 'requested',
  },
  return_reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  refund_method: {
    type: DataTypes.ENUM('instapay', 'wallet', 'bank_transfer', 'card_reversal'),
    allowNull: false,
    defaultValue: 'instapay',
  },
  refund_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  admin_inspection_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  processed_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'admin_users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
}, {
  tableName: 'order_returns',
  indexes: [
    { fields: ['rma_number'], unique: true },
    { fields: ['order_id'] },
    { fields: ['status'] },
  ],
});

module.exports = OrderReturn;
