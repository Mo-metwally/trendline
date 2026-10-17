const { sequelize } = require('../config/db');
const seedSuperAdmin = require('./seedSuperAdmin');
const seedShippingZones = require('./seedShippingZones');
const seedInitialData = require('./seedInitialData');

const runSeeders = async () => {
  try {
    console.log(' Running database seeders...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    await seedSuperAdmin();
    await seedShippingZones();
    await seedInitialData();

    console.log(' All seeders completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(' Seeder execution failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runSeeders();
}

module.exports = runSeeders;
