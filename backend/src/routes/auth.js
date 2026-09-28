const express = require('express');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');
const User = require('../models/User');
const userResponse = require('../utils/userResponse');
const { normalizeEmail } = require('../utils/validation');

const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => res.status(429).json({ error: 'Too many login attempts' }),
});

router.post('/login', loginLimiter, async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  if (!email || typeof password !== 'string') {
    return res.status(400).json({ error: 'Valid email and password are required' });
  }

  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordMatches = user ? await argon2.verify(user.passwordHash, password) : false;
  if (!passwordMatches || user.status !== 'active') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({}, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: user.id,
    expiresIn: '8h',
  });
  res.json({ token, user: userResponse(user) });
});

module.exports = router;
