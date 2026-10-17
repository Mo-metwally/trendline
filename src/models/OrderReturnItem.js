const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrderReturnItem = sequelize.define('OrderReturnItem', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  rma_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'order_returns',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  order_item_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'order_items',
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
    onDelete: 'RESTRICT',
  },
  quantity_returned: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  item_condition: {
    type: DataTypes.ENUM('sealed', 'open_box_good', 'defective_damaged'),
    allowNull: false,
    defaultValue: 'sealed',
  },
  restock_action: {
    type: DataTypes.ENUM('restock_available', 'move_to_damaged'),
    allowNull: false,
    defaultValue: 'restock_available',
  },
}, {
  tableName: 'order_return_items',
  timestamps: false,
  indexes: [
    { fields: ['rma_id'] },
    { fields: ['order_item_id'] },
    { fields: ['product_id'] },
  ],
});

module.exports = OrderReturnItem;
