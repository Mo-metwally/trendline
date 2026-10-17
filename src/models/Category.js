const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    autoIncrement: false,
  },
  parent_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  name_ar: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  name_en: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(160),
    allowNull: false,
    unique: true,
  },
  description_ar: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description_en: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  icon_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  starting_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  show_in_home_grid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
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
  tableName: 'categories',
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['parent_id'] },
    { fields: ['show_in_home_grid'] },
    { fields: ['is_active'] },
  ],
});

module.exports = Category;
