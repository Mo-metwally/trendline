const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ProductTag = sequelize.define('ProductTag', {
  product_id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    references: {
      model: 'products',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  tag_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    references: {
      model: 'tags',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'product_tags',
  timestamps: false,
  indexes: [
    { fields: ['product_id'] },
    { fields: ['tag_id'] },
  ],
});

module.exports = ProductTag;
