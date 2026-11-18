const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
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
  short_desc_ar: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  short_desc_en: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  details_ar: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  details_en: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cover_image: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  theme_mode: {
    type: DataTypes.STRING(50),
    defaultValue: 'preset', // 'preset' | 'solid' | 'gradient'
  },
  preset_style: {
    type: DataTypes.STRING(100),
    defaultValue: 'card-white-glass',
  },
  surface_finish: {
    type: DataTypes.STRING(50),
    defaultValue: 'glass', // 'glass' | 'glossy' | 'matt'
  },
  solid_color: {
    type: DataTypes.STRING(50),
    defaultValue: '#1d4ed8',
  },
  gradient_color1: {
    type: DataTypes.STRING(50),
    defaultValue: '#0284c7',
  },
  gradient_color2: {
    type: DataTypes.STRING(50),
    defaultValue: '#1d4ed8',
  },
  gradient_angle: {
    type: DataTypes.INTEGER,
    defaultValue: 135,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'services',
  timestamps: true,
  indexes: [
    { fields: ['slug'] },
    { fields: ['is_active'] },
    { fields: ['sort_order'] },
  ],
});

module.exports = Service;
