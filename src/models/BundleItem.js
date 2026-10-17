const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BundleItem = sequelize.define('BundleItem', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  bundle_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'bundles',
      key: 'id',
    },
    onDelete: 'CASCADE',
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
    },
  },
}, {
  tableName: 'bundle_items',
  timestamps: false,
  indexes: [
    { fields: ['bundle_id'] },
    { fields: ['product_id'] },
  ],
});

module.exports = BundleItem;
