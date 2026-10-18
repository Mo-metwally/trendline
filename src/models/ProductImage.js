const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ProductImage = sequelize.define('ProductImage', {
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
  image_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  alt_text_ar: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  alt_text_en: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'product_images',
  indexes: [
    { fields: ['product_id'] },
    { fields: ['is_primary'] },
    { fields: ['sort_order'] },
  ],
});

module.exports = ProductImage;
