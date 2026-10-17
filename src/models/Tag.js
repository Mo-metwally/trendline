const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name_ar: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  name_en: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  slug: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'tags',
  timestamps: false,
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['name_ar'], unique: true },
    { fields: ['name_en'], unique: true },
  ],
});

module.exports = Tag;
