const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Bundle = sequelize.define('Bundle', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false,
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
  description_ar: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description_en: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  original_total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  bundle_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  discount_percent: {
    type: DataTypes.SMALLINT,
    defaultValue: 0,
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  starts_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'bundles',
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['sku'], unique: true },
    { fields: ['is_featured'] },
    { fields: ['is_active'] },
  ],
});

module.exports = Bundle;
