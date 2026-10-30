const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BundleCategory = sequelize.define('BundleCategory', {
  bundle_id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    references: {
      model: 'bundles',
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
}, {
  tableName: 'bundle_categories',
  timestamps: false,
  indexes: [
    { fields: ['bundle_id'] },
    { fields: ['category_id'] },
  ],
});

module.exports = BundleCategory;
