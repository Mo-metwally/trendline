const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  po_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  supplier_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'suppliers',
      key: 'id',
    },
    onDelete: 'RESTRICT',
  },
  status: {
    type: DataTypes.ENUM('draft', 'ordered', 'received', 'cancelled'),
    allowNull: false,
    defaultValue: 'draft',
  },
  total_cost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'admin_users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  received_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'purchase_orders',
  indexes: [
    { fields: ['po_number'], unique: true },
    { fields: ['supplier_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
  ],
});

module.exports = PurchaseOrder;
