const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  company_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  contact_person: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  tax_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  balance_due: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Current accounts payable owed to vendor',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'suppliers',
  indexes: [
    { fields: ['company_name'] },
    { fields: ['phone'] },
    { fields: ['is_active'] },
  ],
});

module.exports = Supplier;
