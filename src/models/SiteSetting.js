const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SiteSetting = sequelize.define('SiteSetting', {
  setting_key: {
    type: DataTypes.STRING(100),
    primaryKey: true,
  },
  setting_value_ar: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  setting_value_en: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  setting_value_common: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Language-neutral values (phone, email, logo url, socials)',
  },
  setting_group: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'general',
  },
}, {
  tableName: 'site_settings',
  createdAt: false,
  indexes: [
    { fields: ['setting_group'] },
  ],
});

module.exports = SiteSetting;
