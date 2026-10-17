const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AdminOtp = sequelize.define('AdminOtp', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  admin_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'admin_users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  otp_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  attempts: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    defaultValue: 0,
  },
  is_used: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'admin_otps',
  indexes: [
    { fields: ['admin_id'] },
    { fields: ['expires_at'] },
  ],
});

module.exports = AdminOtp;
