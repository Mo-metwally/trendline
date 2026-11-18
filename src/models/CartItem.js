const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  cart_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'carts',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  product_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    references: {
      model: 'products',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  bundle_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    references: {
      model: 'bundles',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  item_type: {
    type: DataTypes.ENUM('product', 'bundle'),
    allowNull: false,
    defaultValue: 'product',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
    },
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
}, {
  tableName: 'cart_items',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['cart_id'] },
    { fields: ['product_id'] },
    { fields: ['bundle_id'] },
  ],
});

module.exports = CartItem;
