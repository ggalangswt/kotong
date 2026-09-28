require('dotenv').config();

const argon2 = require('argon2');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const { normalizeEmail, normalizeName, validPassword } = require('../src/utils/validation');

async function seedAdmin() {
  const name = normalizeName(process.env.ADMIN_NAME);
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD;
  if (!process.env.MONGODB_URI || !name || !email || !validPassword(password)) {
    throw new Error('MONGODB_URI, valid ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD (8-128 characters) are required');
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') throw new Error('ADMIN_EMAIL is already used by a cashier');
    console.log('Admin already exists; no changes made');
    return;
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await User.create({ name, email, passwordHash, role: 'admin' });
  console.log('Admin created');
}

if (require.main === module) {
  seedAdmin()
    .catch((error) => {
      console.error('Admin seed failed:', error);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}

module.exports = seedAdmin;
