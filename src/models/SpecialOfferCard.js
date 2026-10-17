const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SpecialOfferCard = sequelize.define('SpecialOfferCard', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  title_ar: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  title_en: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  discount_label_ar: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  discount_label_en: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  target_url: {
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
  tableName: 'special_offer_cards',
  timestamps: false,
  indexes: [
    { fields: ['sort_order'] },
    { fields: ['is_active'] },
  ],
});

module.exports = SpecialOfferCard;
