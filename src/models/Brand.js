const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Brand = sequelize.define('Brand', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name_ar: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  name_en: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
  },
  logo_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'brands',
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['is_featured'] },
    { fields: ['is_active'] },
  ],
});

module.exports = Brand;
