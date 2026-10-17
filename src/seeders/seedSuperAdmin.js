const bcrypt = require('bcryptjs');
const { AdminUser } = require('../models');

const seedSuperAdmin = async () => {
  const email = (process.env.DEFAULT_SUPERADMIN_EMAIL || 'ahmed.sayed@trendlineeg.com').toLowerCase().trim();
  const rawPassword = process.env.DEFAULT_SUPERADMIN_PASSWORD || 'trendlineeg@01009770207';

  const existing = await AdminUser.findOne({ where: { email } });

  if (!existing) {
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const superAdmin = await AdminUser.create({
      full_name: 'Ahmed Sayed (Super Admin)',
      email,
      password_hash: passwordHash,
      role: 'super_admin',
      preferred_lang: 'ar',
      is_active: true,
    });
    console.log(` Default Super Admin seeded: ${superAdmin.email}`);
  } else {
    console.log(`ℹ️ Super Admin already exists: ${existing.email}`);
  }
};

module.exports = seedSuperAdmin;
