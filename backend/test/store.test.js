const test = require('node:test');
const assert = require('node:assert/strict');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const { Store, STORE_DEFAULTS } = require('../src/models/Store');

async function tokenFor(role) {
  const passwordHash = await argon2.hash('password-123', { type: argon2.argon2id });
  const user = await User.create({ name: `${role} user`, email: `${role}@example.com`, passwordHash, role });
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
}

test('Store profile', async (t) => {
  const mongo = await MongoMemoryServer.create();
  process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
  await mongoose.connect(mongo.getUri());

  try {
    const adminToken = await tokenFor('admin');
    const cashierToken = await tokenFor('cashier');
    const auth = (token) => ({ Authorization: `Bearer ${token}` });

    await t.test('requires authentication', async () => {
      const response = await request(app).get('/api/store');
      assert.equal(response.status, 401);
    });

    await t.test('returns defaults and creates a single document on first read', async () => {
      const first = await request(app).get('/api/store').set(auth(cashierToken));
      assert.equal(first.status, 200);
      assert.equal(first.body.store.name, STORE_DEFAULTS.name);
      assert.equal(first.body.store.type, STORE_DEFAULTS.type);
      await request(app).get('/api/store').set(auth(adminToken));
      assert.equal(await Store.countDocuments(), 1);
    });

    await t.test('admin updates name and type with trimming', async () => {
      const response = await request(app)
        .patch('/api/store')
        .set(auth(adminToken))
        .send({ name: '  Toko Berkah  ', type: ' Toko kelontong ' });
      assert.equal(response.status, 200);
      assert.equal(response.body.store.name, 'Toko Berkah');
      assert.equal(response.body.store.type, 'Toko kelontong');

      const partial = await request(app).patch('/api/store').set(auth(adminToken)).send({ type: 'Warung' });
      assert.equal(partial.status, 200);
      assert.equal(partial.body.store.name, 'Toko Berkah');
      assert.equal(partial.body.store.type, 'Warung');

      const read = await request(app).get('/api/store').set(auth(cashierToken));
      assert.equal(read.body.store.name, 'Toko Berkah');
      assert.equal(await Store.countDocuments(), 1);
    });

    await t.test('cashier cannot update the store', async () => {
      const response = await request(app).patch('/api/store').set(auth(cashierToken)).send({ name: 'Lain' });
      assert.equal(response.status, 403);
    });

    await t.test('rejects invalid input', async () => {
      const cases = [{}, { name: '   ' }, { name: 'x'.repeat(101) }, { type: 42 }, { type: 'x'.repeat(61) }];
      for (const body of cases) {
        const response = await request(app).patch('/api/store').set(auth(adminToken)).send(body);
        assert.equal(response.status, 400, JSON.stringify(body));
      }
    });
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});
