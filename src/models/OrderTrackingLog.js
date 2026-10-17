const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrderTrackingLog = sequelize.define('OrderTrackingLog', {
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
  from_status: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  to_status: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  title_ar: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  title_en: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  notes_ar: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes_en: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  internal_erp_note: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Private warehouse / ERP internal note hidden from customer',
  },
  updated_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'admin_users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
}, {
  tableName: 'order_tracking_logs',
  updatedAt: false,
  indexes: [
    { fields: ['order_id'] },
    { fields: ['to_status'] },
    { fields: ['created_at'] },
  ],
});

module.exports = OrderTrackingLog;
