const express = require('express');

const app = express();
const notImplemented = (_req, res) => res.status(501).json({ error: 'Not implemented' });

app.post('/api/auth/login', notImplemented);

app.get('/api/cashiers', notImplemented);
app.post('/api/cashiers', notImplemented);
app.patch('/api/cashiers/:id/status', notImplemented);

app.get('/api/products', notImplemented);
app.post('/api/products', notImplemented);
app.patch('/api/products/:id', notImplemented);
app.delete('/api/products/:id', notImplemented);
app.post('/api/products/:id/stock-adjustments', notImplemented);
app.get('/api/products/:id/stock-movements', notImplemented);
app.get('/api/products/low-stock', notImplemented);

app.post('/api/transactions', notImplemented);
app.get('/api/transactions', notImplemented);
app.get('/api/transactions/:id', notImplemented);

app.get('/api/reports/daily-revenue', notImplemented);
app.get('/api/reports/best-sellers', notImplemented);

// Rute fitur lanjutan.
app.get('/api/reports/export', notImplemented);
app.post('/api/payments/webhook', notImplemented);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Kotong backend listening on port ${port}`));
