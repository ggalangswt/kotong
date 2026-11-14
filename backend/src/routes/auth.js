const express = require('express');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');
const User = require('../models/User');
const userResponse = require('../utils/userResponse');
const { normalizeEmail, normalizeName, validPassword } = require('../utils/validation');

const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => res.status(429).json({ error: 'Too many login attempts' }),
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => res.status(429).json({ error: 'Too many registration attempts' }),
});

function signToken(userId) {
  return jwt.sign({}, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: userId,
    expiresIn: '8h',
  });
}

router.post('/register', registerLimiter, async (req, res) => {
  const name = normalizeName(req.body?.name);
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  if (!name || !email || !validPassword(password)) {
    return res
      .status(400)
      .json({ error: 'Valid name, email, and password (8-128 characters) are required' });
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await User.create({ name, email, passwordHash, role: 'admin' });
  const token = signToken(user.id);
  res.status(201).json({ token, user: userResponse(user) });
});

router.post('/login', loginLimiter, async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  const role = req.body?.role;
  if (!email || typeof password !== 'string') {
    return res.status(400).json({ error: 'Valid email and password are required' });
  }
  if (role !== undefined && role !== 'admin' && role !== 'cashier') {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordMatches = user ? await argon2.verify(user.passwordHash, password) : false;
  if (!passwordMatches || user.status !== 'active') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (role && user.role !== role) {
    return res.status(403).json({
      error: role === 'admin' ? 'Account is not an admin' : 'Account is not a cashier',
    });
  }

  const token = signToken(user.id);
  res.json({ token, user: userResponse(user) });
});

module.exports = router;
