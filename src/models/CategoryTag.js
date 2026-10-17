const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CategoryTag = sequelize.define('CategoryTag', {
  category_id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    references: {
      model: 'categories',
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
  tableName: 'category_tags',
  timestamps: false,
  indexes: [
    { fields: ['category_id'] },
    { fields: ['tag_id'] },
  ],
});

module.exports = CategoryTag;
