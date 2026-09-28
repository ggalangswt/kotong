const express = require('express');
const argon2 = require('argon2');
const mongoose = require('mongoose');
const User = require('../models/User');
const userResponse = require('../utils/userResponse');
const { normalizeEmail, normalizeName, validPassword } = require('../utils/validation');

const router = express.Router();

router.get('/', async (_req, res) => {
  const cashiers = await User.find({ role: 'cashier' }).sort({ createdAt: -1, _id: -1 });
  res.json({ cashiers: cashiers.map(userResponse) });
});

router.post('/', async (req, res) => {
  const name = normalizeName(req.body?.name);
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  if (!name || !email || !validPassword(password)) {
    return res.status(400).json({ error: 'Valid name, email, and password (8-128 characters) are required' });
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const cashier = await User.create({ name, email, passwordHash, role: 'cashier' });
  res.status(201).json({ cashier: userResponse(cashier) });
});

router.patch('/:id/status', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid cashier id' });
  }
  const status = req.body?.status;
  if (status !== 'active' && status !== 'inactive') {
    return res.status(400).json({ error: 'Status must be active or inactive' });
  }

  const cashier = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'cashier' },
    { status },
    { returnDocument: 'after', runValidators: true }
  );
  if (!cashier) return res.status(404).json({ error: 'Cashier not found' });
  res.json({ cashier: userResponse(cashier) });
});

module.exports = router;
