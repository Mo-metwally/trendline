const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ShippingZone = sequelize.define('ShippingZone', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  governorate_ar: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  governorate_en: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  shipping_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  estimated_days_ar: {
    type: DataTypes.STRING(50),
    defaultValue: '2-4 أيام عمل',
  },
  estimated_days_en: {
    type: DataTypes.STRING(50),
    defaultValue: '2-4 Business Days',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'shipping_zones',
  timestamps: false,
  indexes: [
    { fields: ['governorate_ar'], unique: true },
    { fields: ['governorate_en'], unique: true },
    { fields: ['is_active'] },
  ],
});

module.exports = ShippingZone;
