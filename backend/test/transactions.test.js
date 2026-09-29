const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Transaction = require('../src/models/Transaction');

test('cash sales update stock atomically and cashiers see only their own history', async () => {
  const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
  try {
    await mongoose.connect(mongo.getUri());
    const users = await User.create([
      { name: 'Admin', email: 'admin@example.com', passwordHash: 'unused', role: 'admin' },
      { name: 'Kasir A', email: 'a@example.com', passwordHash: 'unused', role: 'cashier' },
      { name: 'Kasir B', email: 'b@example.com', passwordHash: 'unused', role: 'cashier' },
    ]);
    const token = user => `Bearer ${jwt.sign({}, process.env.JWT_SECRET, {
      subject: user.id, algorithm: 'HS256', expiresIn: '1h',
    })}`;
    const products = mongoose.connection.collection('products');
    const ids = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
    await products.insertMany([
      { _id: ids[0], name: 'Beras', price: 12000, stock: 5 },
      { _id: ids[1], name: 'Gula', price: 8000, stock: 1 },
      { _id: ids[2], name: 'Produk nonaktif', price: 1000, stock: 5, isActive: false },
    ]);

    const body = { paymentMethod: 'cash', items: [{ productId: String(ids[0]), quantity: 2 }] };
    assert.equal((await request(app).post('/api/transactions').send(body)).status, 401);
    assert.equal((await request(app).post('/api/transactions').set('Authorization', token(users[0])).send(body)).status, 403);
    assert.equal((await request(app).post('/api/transactions').set('Authorization', token(users[1]))
      .send({ ...body, items: [body.items[0], body.items[0]] })).status, 400);
    assert.equal((await request(app).post('/api/transactions').set('Authorization', token(users[1]))
      .send({ ...body, items: [{ productId: String(ids[2]), quantity: 1 }] })).status, 404);

    const created = await request(app).post('/api/transactions').set('Authorization', token(users[1])).send(body);
    assert.equal(created.status, 201);
    assert.equal(created.body.transaction.totalAmount, 24000);
    assert.equal(created.body.transaction.items[0].priceAtTransaction, 12000);
    assert.equal(created.body.transaction.cashierId, users[1].id);
    assert.equal((await products.findOne({ _id: ids[0] })).stock, 3);
    const movement = await mongoose.connection.collection('stockmovements').findOne({ transactionId: new mongoose.Types.ObjectId(created.body.transaction.id) });
    assert.equal(movement.quantity, -2);
    assert.equal(movement.stockBefore, 5);
    assert.equal(movement.stockAfter, 3);

    const failed = await request(app).post('/api/transactions').set('Authorization', token(users[1])).send({
      paymentMethod: 'cash', items: [
        { productId: String(ids[0]), quantity: 1 },
        { productId: String(ids[1]), quantity: 2 },
      ],
    });
    assert.equal(failed.status, 409);
    assert.equal((await products.findOne({ _id: ids[0] })).stock, 3);
    assert.equal(await Transaction.countDocuments(), 1);

    const competing = await Promise.all([users[1], users[2]].map(user =>
      request(app).post('/api/transactions').set('Authorization', token(user)).send({
        paymentMethod: 'cash', items: [{ productId: String(ids[1]), quantity: 1 }],
      })
    ));
    assert.deepEqual(competing.map(result => result.status).sort(), [201, 409]);
    assert.equal((await products.findOne({ _id: ids[1] })).stock, 0);

    const own = await request(app).get('/api/transactions').set('Authorization', token(users[1]));
    assert.ok(own.body.transactions.some(transaction => transaction.id === created.body.transaction.id));
    const other = await request(app).get('/api/transactions').set('Authorization', token(users[2]));
    assert.ok(other.body.transactions.every(transaction => transaction.cashierId === users[2].id));
    assert.equal((await request(app).get(`/api/transactions/${created.body.transaction.id}`)
      .set('Authorization', token(users[2]))).status, 404);
    assert.equal((await request(app).get(`/api/transactions/${created.body.transaction.id}`)
      .set('Authorization', token(users[0]))).status, 200);
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});
