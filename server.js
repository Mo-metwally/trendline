const path = require('path');
const dotenv = require('dotenv');

// Load environment configuration
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { sequelize, testConnection } = require('./src/config/db');
require('./src/models'); // load all models and associations
const routes = require('./src/routes');
const localizationMiddleware = require('./src/middleware/localizationMiddleware');
const errorHandler = require('./src/middleware/errorHandler');
const seedSuperAdmin = require('./src/seeders/seedSuperAdmin');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());

// CORS Configuration
const allowlist = (process.env.ALLOWLIST || 'http://localhost:3000,http://192.168.1.2:3000,http://localhost:5000,http://192.168.1.2:5000')
  .split(',')
  .map((item) => item.trim().replace(/^\[|\]$/g, '')); // clean markdown bracket artifacts if any

const corsOptions = {
  origin: function (origin, callback) {
    // allow server-to-server or non-browser requests
    if (!origin) return callback(null, true);
    if (allowlist.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not permitted by CORS policy`));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// HTTP Request Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Request Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Rate Limiter (for general API abuse protection)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api/', apiLimiter);

// Localization Middleware
app.use(localizationMiddleware);

// API Routes
app.use('/api/v1', routes);

// Centralized Error Handler
app.use(errorHandler);

// Start Server and Database Sync
const startServer = async () => {
  try {
    await testConnection();

    // Synchronize models with PostgreSQL
    console.log(' Synchronizing Sequelize models with PostgreSQL...');
    await sequelize.sync({ alter: true });
    console.log(' All 33 Database tables synchronized successfully.');

    // Ensure default Super Admin exists
    await seedSuperAdmin();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(` Trendline Tech Backend Server running on http://0.0.0.0:${PORT}`);
      console.log(` Base URL: ${process.env.BASE_URL || `http://192.168.1.2:${PORT}`}`);
      console.log(` Client URL: ${process.env.CLIENT_URL || 'http://192.168.1.2:3000'}`);
      console.log(`️ CORS Allowlist: ${allowlist.join(', ')}`);
    });
  } catch (error) {
    console.error(' Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
