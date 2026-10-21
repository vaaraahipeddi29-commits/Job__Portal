// Creates the first Admin account (admins cannot self-register through the API).
// Usage: npm run seed:admin
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

(async () => {
  try {
    const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error('Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD in your .env file');
    }
    await mongoose.connect(MONGO_URI);

    const email = ADMIN_EMAIL.toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`Admin already exists: ${email}`);
    } else {
      await User.create({ name: ADMIN_NAME || 'Platform Admin', email, password: ADMIN_PASSWORD, role: 'admin' });
      console.log(`Admin created: ${email}`);
    }
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
