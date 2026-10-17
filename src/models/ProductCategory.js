const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ProductCategory = sequelize.define('ProductCategory', {
  product_id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    references: {
      model: 'products',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  category_id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    references: {
      model: 'categories',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_auto_assigned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'true when auto-linked via tag-matching algorithm',
  },
}, {
  tableName: 'product_categories',
  timestamps: false,
  indexes: [
    { fields: ['product_id'] },
    { fields: ['category_id'] },
    { fields: ['is_primary'] },
    { fields: ['is_auto_assigned'] },
  ],
});

module.exports = ProductCategory;
