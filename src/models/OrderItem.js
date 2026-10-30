const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
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
  item_type: {
    type: DataTypes.ENUM('product', 'bundle'),
    allowNull: false,
    defaultValue: 'product',
  },
  product_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    references: {
      model: 'products',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  bundle_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    references: {
      model: 'bundles',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  item_name_snapshot_ar: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  item_name_snapshot_en: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  sku_snapshot: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  unit_cost_snapshot: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'COGS snapshot at moment of purchase',
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  refunded_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  bundle_breakdown_json: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Snapshot of sub-products & quantities when purchased as a bundle',
  },
}, {
  tableName: 'order_items',
  timestamps: false,
  indexes: [
    { fields: ['order_id'] },
    { fields: ['product_id'] },
    { fields: ['bundle_id'] },
  ],
});

module.exports = OrderItem;
