const express = require('express');
const authRoutes = require('./routes/auth');
const cashierRoutes = require('./routes/cashiers');
const { requireAuth, requireRole } = require('./middleware/auth');

const app = express();
const notImplemented = (_req, res) => res.status(501).json({ error: 'Not implemented' });

app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', authRoutes);
app.use('/api/cashiers', requireAuth, requireRole('admin'), cashierRoutes);

// Stub routes remain available for the modules owned by the other team members.
app.get('/api/products/low-stock', requireAuth, requireRole('admin'), notImplemented);
app.get('/api/products', requireAuth, requireRole('admin', 'cashier'), notImplemented);
app.post('/api/products', requireAuth, requireRole('admin'), notImplemented);
app.patch('/api/products/:id', requireAuth, requireRole('admin'), notImplemented);
app.delete('/api/products/:id', requireAuth, requireRole('admin'), notImplemented);
app.post('/api/products/:id/stock-adjustments', requireAuth, requireRole('admin'), notImplemented);
app.get('/api/products/:id/stock-movements', requireAuth, requireRole('admin'), notImplemented);

app.post('/api/transactions', requireAuth, requireRole('cashier'), notImplemented);
app.get('/api/transactions', requireAuth, requireRole('admin', 'cashier'), notImplemented);
app.get('/api/transactions/:id', requireAuth, requireRole('admin', 'cashier'), notImplemented);

app.get('/api/reports/daily-revenue', requireAuth, requireRole('admin'), notImplemented);
app.get('/api/reports/best-sellers', requireAuth, requireRole('admin'), notImplemented);
app.get('/api/reports/export', requireAuth, requireRole('admin'), notImplemented);
app.post('/api/payments/webhook', notImplemented);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((error, _req, res, _next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' });
  }
  if (error.code === 11000) {
    return res.status(409).json({ error: 'Email already in use' });
  }
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid request data' });
  }
  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
