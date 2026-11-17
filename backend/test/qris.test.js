const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

// Routes Xendit calls to an in-memory fake; everything else (none expected) goes to the real fetch.
function fakeXendit() {
  const state = { failCreate: false, paidQrIds: new Set(), created: 0 };
  const realFetch = global.fetch;
  global.fetch = async (url, init = {}) => {
    const { pathname } = new URL(url);
    if (!String(url).startsWith('https://api.xendit.co')) return realFetch(url, init);
    const json = (status, body) => new Response(JSON.stringify(body), { status });
    if (init.method === 'POST' && pathname === '/qr_codes') {
      if (state.failCreate) return json(403, { error_code: 'REQUEST_FORBIDDEN_ERROR', message: 'forbidden' });
      const body = JSON.parse(init.body);
      state.created++;
      return json(200, { id: `qr_${body.reference_id}`, qr_string: `QRIS-${body.amount}`, expires_at: body.expires_at });
    }
    const simulate = /^\/qr_codes\/([^/]+)\/payments\/simulate$/.exec(pathname);
    if (simulate) { state.paidQrIds.add(simulate[1]); return json(200, { status: 'SUCCEEDED' }); }
    const list = /^\/qr_codes\/([^/]+)\/payments$/.exec(pathname);
    if (list) {
      return json(200, { data: state.paidQrIds.has(list[1])
        ? [{ id: 'qrpy_1', status: 'SUCCEEDED', created: new Date().toISOString() }] : [] });
    }
    return json(404, { error_code: 'NOT_FOUND' });
  };
  return { state, restore: () => { global.fetch = realFetch; } };
}

test('QRIS sales reserve stock until paid, and release it when cancelled or failed', async () => {
  const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
  process.env.XENDIT_SECRET_KEY = 'xnd_development_test';
  process.env.XENDIT_CALLBACK_TOKEN = 'callback-token-for-tests';
  const xendit = fakeXendit();
  try {
    await mongoose.connect(mongo.getUri());
    const [admin, cashier, other] = await User.create([
      { name: 'Admin', email: 'admin@example.com', passwordHash: 'unused', role: 'admin' },
      { name: 'Kasir', email: 'k@example.com', passwordHash: 'unused', role: 'cashier' },
      { name: 'Kasir 2', email: 'k2@example.com', passwordHash: 'unused', role: 'cashier' },
    ]);
    const auth = user => `Bearer ${jwt.sign({}, process.env.JWT_SECRET, { subject: user.id, algorithm: 'HS256' })}`;
    const products = mongoose.connection.collection('products');
    const productId = new mongoose.Types.ObjectId();
    await products.insertOne({ _id: productId, name: 'Kopi', price: 5000, stock: 10 });
    const stock = async () => (await products.findOne({ _id: productId })).stock;
    const sell = quantity => request(app).post('/api/transactions').set('Authorization', auth(cashier))
      .send({ paymentMethod: 'qris', items: [{ productId: String(productId), quantity }] });

    // Create: stock reserved, QR returned, status pending.
    const created = await sell(2);
    assert.equal(created.status, 201);
    const sale = created.body.transaction;
    assert.equal(sale.status, 'pending');
    assert.equal(sale.payment.qrString, 'QRIS-10000');
    assert.equal(sale.payment.testMode, true);
    assert.equal(await stock(), 8);

    // Pending sales do not count as revenue.
    const pendingReport = await request(app).get('/api/reports/daily-revenue').set('Authorization', auth(admin));
    assert.equal(pendingReport.body.totalRevenue, 0);

    // Polling while unpaid keeps it pending; other cashiers cannot see it.
    const poll = () => request(app).get(`/api/transactions/${sale.id}/payment`).set('Authorization', auth(cashier));
    assert.equal((await poll()).body.transaction.status, 'pending');
    assert.equal((await request(app).get(`/api/transactions/${sale.id}/payment`).set('Authorization', auth(other))).status, 404);

    // Simulated payment (test mode) marks it paid and hides the QR string.
    const simulated = await request(app).post(`/api/transactions/${sale.id}/simulate-payment`).set('Authorization', auth(cashier));
    assert.equal(simulated.status, 200);
    assert.equal(simulated.body.transaction.status, 'paid');
    assert.equal(simulated.body.transaction.payment.qrString, undefined);
    assert.equal(simulated.body.transaction.payment.testMode, undefined);
    assert.equal(await stock(), 8);
    assert.equal((await request(app).post(`/api/transactions/${sale.id}/cancel`).set('Authorization', auth(cashier))).status, 409);

    // Live key: the screen must not offer simulation and the endpoint refuses it.
    process.env.XENDIT_SECRET_KEY = 'xnd_production_test';
    const live = (await sell(1)).body.transaction;
    assert.equal(live.payment.testMode, false);
    assert.equal((await request(app).post(`/api/transactions/${live.id}/simulate-payment`).set('Authorization', auth(cashier))).status, 404);
    await request(app).post(`/api/transactions/${live.id}/cancel`).set('Authorization', auth(cashier));
    process.env.XENDIT_SECRET_KEY = 'xnd_development_test';

    // Cancel: stock comes back exactly once.
    const toCancel = (await sell(3)).body.transaction;
    assert.equal(await stock(), 5);
    const cancelled = await request(app).post(`/api/transactions/${toCancel.id}/cancel`).set('Authorization', auth(cashier));
    assert.equal(cancelled.body.transaction.status, 'cancelled');
    assert.equal(await stock(), 8);
    assert.equal((await request(app).post(`/api/transactions/${toCancel.id}/cancel`).set('Authorization', auth(cashier))).status, 409);
    assert.equal(await stock(), 8);

    // Provider failure: 502 and stock restored.
    xendit.state.failCreate = true;
    const failed = await sell(1);
    assert.equal(failed.status, 502);
    assert.equal(await stock(), 8);
    xendit.state.failCreate = false;

    // Webhook: bad token rejected, valid token marks paid.
    const viaWebhook = (await sell(1)).body.transaction;
    const hook = token => request(app).post('/api/payments/webhook').set('x-callback-token', token).send({
      event: 'qr.payment',
      data: { id: 'qrpy_2', qr_id: `qr_${viaWebhook.id}`, status: 'SUCCEEDED', amount: 5000,
        qr_code: { reference_id: viaWebhook.id } },
    });
    assert.equal((await hook('wrong-token-wrong-token-wrong-to')).status, 401);
    assert.equal((await hook(process.env.XENDIT_CALLBACK_TOKEN)).status, 200);
    const detail = await request(app).get(`/api/transactions/${viaWebhook.id}`).set('Authorization', auth(cashier));
    assert.equal(detail.body.transaction.status, 'paid');
    assert.equal(await stock(), 7);
  } finally {
    xendit.restore();
    await mongoose.disconnect();
    await mongo.stop();
  }
});
