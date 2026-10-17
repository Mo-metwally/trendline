const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InventoryTransaction = sequelize.define('InventoryTransaction', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  product_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'products',
      key: 'id',
    },
    onDelete: 'RESTRICT',
  },
  transaction_type: {
    type: DataTypes.ENUM(
      'PO_RECEIVE',
      'RESERVE',
      'RELEASE_RESERVATION',
      'SALE_DEDUCTION',
      'FAILED_DELIVERY_RESTOCK',
      'RMA_RESTOCK',
      'RMA_DAMAGED',
      'MANUAL_ADJUSTMENT'
    ),
    allowNull: false,
  },
  quantity_change: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Positive for increments, negative for decrements',
  },
  stock_before: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  stock_after: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reference_type: {
    type: DataTypes.ENUM('order', 'purchase_order', 'rma', 'manual'),
    allowNull: false,
    defaultValue: 'manual',
  },
  reference_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  performed_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'admin_users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
}, {
  tableName: 'inventory_transactions',
  updatedAt: false,
  indexes: [
    { fields: ['product_id'] },
    { fields: ['transaction_type'] },
    { fields: ['reference_type', 'reference_id'] },
    { fields: ['created_at'] },
  ],
});

module.exports = InventoryTransaction;
