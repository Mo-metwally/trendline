const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StaticPage = sequelize.define('StaticPage', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  title_ar: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  title_en: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
  },
  content_html_ar: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  content_html_en: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'static_pages',
  createdAt: false,
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['is_published'] },
  ],
});

module.exports = StaticPage;
