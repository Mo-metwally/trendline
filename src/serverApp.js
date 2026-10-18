const express = require('express');
const { testConnection } = require('./config/db');
require('./models'); // load all models and associations
const routes = require('./routes');
const localizationMiddleware = require('./middleware/localizationMiddleware');
const errorHandler = require('./middleware/errorHandler');
const seedSuperAdmin = require('./seeders/seedSuperAdmin');

const app = express();

// Disable x-powered-by and etag for dynamic APIs
app.disable('x-powered-by');
app.set('etag', false);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Localization Middleware
app.use(localizationMiddleware);

// API Routes
app.use('/api/v1', routes);

// Centralized Error Handler
app.use(errorHandler);

let initPromise = null;
async function initDb() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await testConnection();
        await seedSuperAdmin();
      } catch (err) {
        console.error('Failed to initialize database:', err);
      }
    })();
  }
  return initPromise;
}

module.exports = { app, initDb };

