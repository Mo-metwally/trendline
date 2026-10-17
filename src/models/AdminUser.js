const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AdminUser = sequelize.define('AdminUser', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  full_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'erp_manager', 'sales_agent', 'warehouse', 'accountant'),
    allowNull: false,
    defaultValue: 'sales_agent',
  },
  preferred_lang: {
    type: DataTypes.ENUM('ar', 'en'),
    allowNull: false,
    defaultValue: 'ar',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'admin_users',
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['role'] },
  ],
});

module.exports = AdminUser;
