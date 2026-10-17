const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend directory or project root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Sequelize } = require('sequelize');

const dbUrl = process.env.DB_URL || 'postgres://postgres:1222440@localhost:5432/trendlineeg';

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    clientMinMessages: 'ignore',
  },
  define: {
    timestamps: true,
    underscored: true,
  },
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(' PostgreSQL database connected successfully via Sequelize.');
  } catch (error) {
    console.error(' Unable to connect to PostgreSQL database:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
};
