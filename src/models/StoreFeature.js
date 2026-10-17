const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StoreFeature = sequelize.define('StoreFeature', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  placement: {
    type: DataTypes.ENUM('middle_features_strip', 'why_choose_us_grid'),
    allowNull: false,
    defaultValue: 'middle_features_strip',
  },
  title_ar: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  title_en: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  subtitle_ar: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  subtitle_en: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  icon_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
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
  tableName: 'store_features',
  timestamps: false,
  indexes: [
    { fields: ['placement'] },
    { fields: ['sort_order'] },
    { fields: ['is_active'] },
  ],
});

module.exports = StoreFeature;
