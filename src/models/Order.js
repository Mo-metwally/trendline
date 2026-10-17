const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  order_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  customer_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  customer_phone: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  customer_phone_2: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  customer_email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  governorate: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  street_address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  order_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  locale: {
    type: DataTypes.ENUM('ar', 'en'),
    allowNull: false,
    defaultValue: 'ar',
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  shipping_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  total_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Snapshot of COGS at order placement for net profit analysis',
  },
  coupon_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  payment_method: {
    type: DataTypes.ENUM('cod', 'credit_card', 'bank_installment', 'instapay', 'wallet'),
    allowNull: false,
    defaultValue: 'cod',
  },
  payment_status: {
    type: DataTypes.ENUM('unpaid', 'paid', 'partially_refunded', 'refunded', 'failed'),
    allowNull: false,
    defaultValue: 'unpaid',
  },
  order_status: {
    type: DataTypes.ENUM(
      'new',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'delivery_failed',
      'returned_to_warehouse',
      'cancelled',
      'return_requested',
      'return_approved',
      'return_received',
      'refunded'
    ),
    allowNull: false,
    defaultValue: 'new',
  },
  courier_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  tracking_waybill: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  cancellation_reason: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  shipped_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'orders',
  indexes: [
    { fields: ['order_number'], unique: true },
    { fields: ['customer_phone'] },
    { fields: ['order_status'] },
    { fields: ['payment_status'] },
    { fields: ['created_at'] },
  ],
});

module.exports = Order;
