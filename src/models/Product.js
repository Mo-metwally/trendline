const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    autoIncrement: false,
  },
  brand_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'brands',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  name_ar: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  name_en: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  barcode: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
  },
  short_desc_ar: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  short_desc_en: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  description_ar: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description_en: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  specifications: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  video_urls: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
  },
  cost_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Weighted Average Cost (COGS) for ERP Profit & Loss calculations',
  },
  original_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  sale_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  sale_ends_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Expiration date/timestamp for promotional sale discount',
  },
  discount_percent: {
    type: DataTypes.SMALLINT,
    defaultValue: 0,
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Physical on-hand inventory in warehouse',
  },
  reserved_stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Locked in unfulfilled customer orders (NEW, CONFIRMED, PROCESSING)',
  },
  damaged_stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Damaged or defective units isolated in warehouse',
  },
  low_stock_threshold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  rating_avg: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 5.00,
  },
  reviews_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  available_to_sell: {
    type: DataTypes.VIRTUAL,
    get() {
      const stock = this.getDataValue('stock_quantity') || 0;
      const reserved = this.getDataValue('reserved_stock') || 0;
      return Math.max(0, stock - reserved);
    },
  },
}, {
  tableName: 'products',
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['sku'], unique: true },
    { fields: ['brand_id'] },
    { fields: ['is_featured'] },
    { fields: ['is_active'] },
    { fields: ['stock_quantity'] },
    { fields: ['created_at'] },
  ],
});

module.exports = Product;
