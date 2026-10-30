const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  name_ar: {
    type: DataTypes.STRING(150),
    allowNull: true,
    comment: 'Coupon title/name in Arabic',
  },
  name_en: {
    type: DataTypes.STRING(150),
    allowNull: true,
    comment: 'Coupon title/name in English',
  },
  description_ar: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  description_en: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  discount_type: {
    type: DataTypes.ENUM('percentage', 'fixed_amount'),
    allowNull: false,
  },
  discount_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  max_discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Capped ceiling for percentage discounts (e.g. 20% max 1000 EGP)',
  },
  min_order_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  first_order_only: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Enforces verification against customer_phone in previous orders',
  },
  usage_limit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Total general usage limit across all orders',
  },
  per_user_limit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
    comment: 'Max usage limit per customer (verified by customer_phone in orders)',
  },
  used_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
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
  tableName: 'coupons',
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['first_order_only'] },
    { fields: ['is_active'] },
    { fields: ['expires_at'] },
  ],
});

module.exports = Coupon;
