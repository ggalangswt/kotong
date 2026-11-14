const express = require('express');
const { requireRole } = require('../middleware/auth');
const { Store, STORE_KEY } = require('../models/Store');

const router = express.Router();
const NAME_MAX = 100;
const TYPE_MAX = 60;

function storeResponse(store) {
  return { name: store.name, type: store.type, updatedAt: store.updatedAt };
}

function normalizeText(value, max) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length >= 1 && text.length <= max ? text : null;
}

async function loadStore() {
  return Store.findOneAndUpdate(
    { key: STORE_KEY },
    { $setOnInsert: { key: STORE_KEY } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

router.get('/', requireRole('admin', 'cashier'), async (_req, res) => {
  const store = await loadStore();
  res.json({ store: storeResponse(store) });
});

router.patch('/', requireRole('admin'), async (req, res) => {
  const body = req.body ?? {};
  const update = {};
  if (body.name !== undefined) {
    const name = normalizeText(body.name, NAME_MAX);
    if (!name) return res.status(400).json({ error: `Store name must be 1-${NAME_MAX} characters` });
    update.name = name;
  }
  if (body.type !== undefined) {
    const type = normalizeText(body.type, TYPE_MAX);
    if (!type) return res.status(400).json({ error: `Store type must be 1-${TYPE_MAX} characters` });
    update.type = type;
  }
  if (!Object.keys(update).length) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  const store = await Store.findOneAndUpdate(
    { key: STORE_KEY },
    { $set: update, $setOnInsert: { key: STORE_KEY } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
  );
  res.json({ store: storeResponse(store) });
});

module.exports = router;
