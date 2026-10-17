const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ProductReview = sequelize.define('ProductReview', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  product_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'products',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  guest_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  guest_phone: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  rating: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  language: {
    type: DataTypes.ENUM('ar', 'en'),
    allowNull: false,
    defaultValue: 'ar',
  },
  is_approved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'product_reviews',
  indexes: [
    { fields: ['product_id'] },
    { fields: ['is_approved'] },
    { fields: ['rating'] },
  ],
});

module.exports = ProductReview;
