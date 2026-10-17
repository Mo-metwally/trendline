const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const NewsletterSubscriber = sequelize.define('NewsletterSubscriber', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  locale: {
    type: DataTypes.ENUM('ar', 'en'),
    allowNull: false,
    defaultValue: 'ar',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'newsletter_subscribers',
  updatedAt: false,
  createdAt: 'subscribed_at',
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['is_active'] },
  ],
});

module.exports = NewsletterSubscriber;
