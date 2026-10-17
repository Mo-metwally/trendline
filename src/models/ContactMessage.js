const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ContactMessage = sequelize.define('ContactMessage', {
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
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  locale: {
    type: DataTypes.ENUM('ar', 'en'),
    allowNull: false,
    defaultValue: 'ar',
  },
  status: {
    type: DataTypes.ENUM('new', 'read', 'replied', 'archived'),
    allowNull: false,
    defaultValue: 'new',
  },
}, {
  tableName: 'contact_messages',
  updatedAt: false,
  indexes: [
    { fields: ['status'] },
    { fields: ['phone'] },
    { fields: ['created_at'] },
  ],
});

module.exports = ContactMessage;
