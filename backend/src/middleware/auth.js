const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  const match = /^Bearer (\S+)$/i.exec(req.get('Authorization') || '');
  if (!match) return res.status(401).json({ error: 'Authentication required' });

  let payload;
  try {
    payload = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!payload.sub || !mongoose.isValidObjectId(payload.sub)) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = await User.findById(payload.sub);
  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
