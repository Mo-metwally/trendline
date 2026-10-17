const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  po_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'purchase_orders',
      key: 'id',
    },
    onDelete: 'CASCADE',
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
  quantity_ordered: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  quantity_received: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  unit_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  total_cost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
}, {
  tableName: 'purchase_order_items',
  timestamps: false,
  indexes: [
    { fields: ['po_id'] },
    { fields: ['product_id'] },
  ],
});

module.exports = PurchaseOrderItem;
