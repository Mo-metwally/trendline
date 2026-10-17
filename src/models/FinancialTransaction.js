const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FinancialTransaction = sequelize.define('FinancialTransaction', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  transaction_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  order_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  rma_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'order_returns',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  po_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'purchase_orders',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  type: {
    type: DataTypes.ENUM('order_revenue', 'customer_refund', 'supplier_payment', 'shipping_expense'),
    allowNull: false,
  },
  direction: {
    type: DataTypes.ENUM('INFLOW', 'OUTFLOW'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  payment_channel: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'cod_cash, paymob_card, instapay, bank_transfer',
  },
  gateway_reference: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  recorded_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'admin_users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
}, {
  tableName: 'financial_transactions',
  updatedAt: false,
  indexes: [
    { fields: ['transaction_number'], unique: true },
    { fields: ['order_id'] },
    { fields: ['rma_id'] },
    { fields: ['po_id'] },
    { fields: ['type'] },
    { fields: ['direction'] },
    { fields: ['created_at'] },
  ],
});

module.exports = FinancialTransaction;
