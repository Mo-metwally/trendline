const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Banner = sequelize.define('Banner', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  placement: {
    type: DataTypes.ENUM('hero_vertical_slider', 'mid_page_promo'),
    allowNull: false,
    defaultValue: 'hero_vertical_slider',
  },
  title_ar: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  title_en: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  subtitle_ar: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  subtitle_en: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  badge_text_ar: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  badge_text_en: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  bg_style: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  button_text_ar: {
    type: DataTypes.STRING(50),
    defaultValue: 'تسوق الآن',
  },
  button_text_en: {
    type: DataTypes.STRING(50),
    defaultValue: 'Shop Now',
  },
  target_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  highlights_json: {
    type: DataTypes.JSONB,
    allowNull: true,
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
  tableName: 'banners',
  indexes: [
    { fields: ['placement'] },
    { fields: ['sort_order'] },
    { fields: ['is_active'] },
  ],
});

module.exports = Banner;
