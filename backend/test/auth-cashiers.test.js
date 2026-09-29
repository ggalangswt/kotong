const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const seedAdmin = require('../scripts/seed-admin');

test('Admin seed, authentication, cashier management, and access control', async (t) => {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
  process.env.ADMIN_NAME = 'Admin Kotong';
  process.env.ADMIN_EMAIL = 'ADMIN@example.com';
  process.env.ADMIN_PASSWORD = 'admin-password-123';

  try {
    await t.test('seed Admin is idempotent and stores a password hash', async () => {
      await seedAdmin();
      const original = await User.findOne({ email: 'admin@example.com' }).select('+passwordHash');
      assert.equal(original.role, 'admin');
      assert.match(original.passwordHash, /^\$argon2id\$/);
      assert.notEqual(original.passwordHash, process.env.ADMIN_PASSWORD);
      await seedAdmin();
      assert.equal(await User.countDocuments({ role: 'admin' }), 1);
      const current = await User.findById(original.id).select('+passwordHash');
      assert.equal(current.passwordHash, original.passwordHash);
    });

    let adminToken;
    await t.test('login returns a token and no password fields', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: ' ADMIN@example.com ',
        password: 'admin-password-123',
      });
      assert.equal(response.status, 200);
      assert.equal(response.body.user.email, 'admin@example.com');
      assert.equal(response.body.user.role, 'admin');
      assert.equal(response.body.user.password, undefined);
      assert.equal(response.body.user.passwordHash, undefined);
      assert.equal(jwt.verify(response.body.token, process.env.JWT_SECRET).sub, response.body.user.id);
      adminToken = response.body.token;
    });

    await t.test('login rejects wrong password and validates input', async () => {
      const wrong = await request(app).post('/api/auth/login').send({
        email: 'admin@example.com', password: 'wrong-password',
      });
      assert.equal(wrong.status, 401);
      assert.deepEqual(wrong.body, { error: 'Invalid email or password' });
      const missing = await request(app).post('/api/auth/login').send({ email: 'bad-email' });
      assert.equal(missing.status, 400);
    });

    let cashierId;
    let cashierToken;
    await t.test('Admin creates and lists a cashier without leaking the hash', async () => {
      const created = await request(app).post('/api/cashiers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Kasir Satu', email: 'KASIR@example.com', password: 'cashier-password-123', role: 'admin' });
      assert.equal(created.status, 201);
      assert.equal(created.body.cashier.role, 'cashier');
      assert.equal(created.body.cashier.email, 'kasir@example.com');
      assert.equal(created.body.cashier.passwordHash, undefined);
      cashierId = created.body.cashier.id;

      const stored = await User.findById(cashierId).select('+passwordHash');
      assert.match(stored.passwordHash, /^\$argon2id\$/);
      const listed = await request(app).get('/api/cashiers').set('Authorization', `Bearer ${adminToken}`);
      assert.equal(listed.status, 200);
      assert.equal(listed.body.cashiers.length, 1);
      assert.equal(listed.body.cashiers[0].passwordHash, undefined);

      const login = await request(app).post('/api/auth/login').send({
        email: 'kasir@example.com', password: 'cashier-password-123',
      });
      assert.equal(login.status, 200);
      cashierToken = login.body.token;
    });

    await t.test('duplicate email and invalid fields are rejected', async () => {
      const duplicate = await request(app).post('/api/cashiers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Duplicate', email: 'kasir@example.com', password: 'cashier-password-123' });
      assert.equal(duplicate.status, 409);
      const invalid = await request(app).post('/api/cashiers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '', email: 'invalid', password: 'short' });
      assert.equal(invalid.status, 400);
      const invalidStatus = await request(app).patch(`/api/cashiers/${cashierId}/status`)
        .set('Authorization', `Bearer ${adminToken}`).send({ status: 'deleted' });
      assert.equal(invalidStatus.status, 400);
    });

    await t.test('missing, expired, and cashier tokens cannot access Admin routes', async () => {
      assert.equal((await request(app).get('/api/cashiers')).status, 401);
      const expired = jwt.sign({}, process.env.JWT_SECRET, {
        subject: cashierId, algorithm: 'HS256', expiresIn: -1,
      });
      assert.equal((await request(app).get('/api/products').set('Authorization', `Bearer ${expired}`)).status, 401);
      assert.equal((await request(app).get('/api/cashiers').set('Authorization', `Bearer ${cashierToken}`)).status, 403);
      assert.equal((await request(app).get('/api/products/low-stock').set('Authorization', `Bearer ${cashierToken}`)).status, 403);
      assert.equal((await request(app).get('/api/products/low-stock').set('Authorization', `Bearer ${adminToken}`)).status, 200);
    });

    await t.test('deactivation invalidates an existing token immediately', async () => {
      const updated = await request(app).patch(`/api/cashiers/${cashierId}/status`)
        .set('Authorization', `Bearer ${adminToken}`).send({ status: 'inactive' });
      assert.equal(updated.status, 200);
      assert.equal(updated.body.cashier.status, 'inactive');
      assert.equal((await request(app).get('/api/products').set('Authorization', `Bearer ${cashierToken}`)).status, 401);
      const login = await request(app).post('/api/auth/login').send({
        email: 'kasir@example.com', password: 'cashier-password-123',
      });
      assert.equal(login.status, 401);
      assert.deepEqual(login.body, { error: 'Invalid email or password' });
    });
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});
