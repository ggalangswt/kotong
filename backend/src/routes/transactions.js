const express = require('express');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { requireRole } = require('../middleware/auth');
const qris = require('../services/qrisPayments');
const xendit = require('../services/xendit');

const router = express.Router();

function response(transaction) {
  return {
    id: String(transaction._id),
    date: transaction.date,
    cashierId: String(transaction.cashierId),
    items: transaction.items.map(item => ({
      productId: String(item.productId),
      productName: item.productName,
      quantity: item.quantity,
      priceAtTransaction: item.priceAtTransaction,
      subtotal: item.subtotal,
    })),
    totalAmount: transaction.totalAmount,
    paymentMethod: transaction.paymentMethod,
    status: transaction.status || 'paid',
    payment: transaction.payment ? {
      qrString: transaction.status === 'pending' ? transaction.payment.qrString : undefined,
      expiresAt: transaction.payment.expiresAt,
      paidAt: transaction.payment.paidAt,
    } : undefined,
  };
}

function ownFilter(req) {
  const filter = { _id: req.params.id };
  if (req.user.role === 'cashier') filter.cashierId = req.user.id;
  return filter;
}

async function findOwn(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: 'Invalid transaction id' });
    return null;
  }
  const transaction = await Transaction.findOne(ownFilter(req));
  if (!transaction) res.status(404).json({ error: 'Transaction not found' });
  return transaction;
}

function providerError(res, error) {
  if (!(error instanceof xendit.XenditError)) throw error;
  console.error('Xendit error', error.status, error.code, error.message);
  return res.status(502).json({ error: 'Payment provider unavailable' });
}

router.post('/', requireRole('cashier'), async (req, res) => {
  const { items, paymentMethod } = req.body || {};
  if (!Transaction.PAYMENT_METHODS.includes(paymentMethod) || !Array.isArray(items) || items.length === 0 ||
      items.some(item => !item || typeof item.productId !== 'string' ||
        !mongoose.isValidObjectId(item.productId) ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1)) {
    return res.status(400).json({ error: 'Invalid transaction data' });
  }

  const ids = items.map(item => item.productId.toLowerCase());
  if (new Set(ids).size !== ids.length) {
    return res.status(400).json({ error: 'Duplicate product' });
  }

  class SaleError extends Error {
    constructor(status, message) { super(message); this.status = status; }
  }

  try {
    const transaction = await mongoose.connection.transaction(async session => {
      const soldItems = [];
      let totalAmount = 0;

      for (const item of items) {
        const productId = new mongoose.Types.ObjectId(item.productId);
        // ponytail: use this provisional collection shape until the owners' models land; switch if their schemas differ.
        const product = await mongoose.connection.collection('products').findOneAndUpdate(
          { _id: productId, isActive: { $ne: false }, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session, returnDocument: 'before' }
        );
        if (!product) {
          const exists = await mongoose.connection.collection('products').findOne(
            { _id: productId, isActive: { $ne: false } }, { session }
          );
          throw new SaleError(exists ? 409 : 404, exists ? 'Insufficient stock' : 'Product not found');
        }
        if (!Number.isSafeInteger(product.price) || product.price < 0 ||
            !Number.isSafeInteger(product.stock) || typeof product.name !== 'string') {
          throw new Error('Invalid product data');
        }
        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;
        if (!Number.isSafeInteger(totalAmount)) throw new SaleError(400, 'Transaction total is too large');

        soldItems.push({ productId, productName: product.name, quantity: item.quantity,
          priceAtTransaction: product.price, subtotal, stockBefore: product.stock,
          stockAfter: product.stock - item.quantity });
      }

      const [created] = await Transaction.create([{
        cashierId: req.user.id, items: soldItems, totalAmount, paymentMethod,
        status: paymentMethod === 'cash' ? 'paid' : 'pending',
      }], { session });
      await mongoose.connection.collection('stockmovements').insertMany(soldItems.map(item => ({
        productId: item.productId,
        transactionId: created._id,
        type: 'sale',
        quantity: -item.quantity,
        stockBefore: item.stockBefore,
        stockAfter: item.stockAfter,
        createdAt: created.date,
      })), { session });
      return created;
    });
    if (paymentMethod === 'qris') {
      try {
        const withQr = await qris.attachQrCode(transaction);
        return res.status(201).json({ transaction: response(withQr) });
      } catch (error) {
        await qris.releasePending(transaction._id, 'failed');
        return providerError(res, error);
      }
    }
    res.status(201).json({ transaction: response(transaction) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    throw error;
  }
});

router.get('/', async (req, res) => {
  const filter = req.user.role === 'cashier' ? { cashierId: req.user.id } : {};
  const transactions = await Transaction.find(filter).sort({ date: -1, _id: -1 }).lean();
  res.json({ transactions: transactions.map(response) });
});

router.get('/:id', async (req, res) => {
  const transaction = await findOwn(req, res);
  if (transaction) res.json({ transaction: response(transaction) });
});

// Polled by the cashier screen while the customer scans the QRIS code.
router.get('/:id/payment', async (req, res) => {
  const transaction = await findOwn(req, res);
  if (!transaction) return;
  try {
    res.json({ transaction: response(await qris.syncWithProvider(transaction)) });
  } catch (error) {
    providerError(res, error);
  }
});

router.post('/:id/cancel', requireRole('cashier'), async (req, res) => {
  const transaction = await findOwn(req, res);
  if (!transaction) return;
  try {
    // Check the provider first so a sale the customer already paid is never voided.
    const latest = await qris.syncWithProvider(transaction);
    if (latest.status !== 'pending') {
      return res.status(409).json({ error: 'Transaction is not pending', transaction: response(latest) });
    }
  } catch (error) {
    return providerError(res, error);
  }
  const cancelled = await qris.releasePending(transaction._id, 'cancelled');
  if (!cancelled) return res.status(409).json({ error: 'Transaction is not pending' });
  res.json({ transaction: response(cancelled) });
});

// Test mode only: lets the cashier simulate a customer paying the QR code.
router.post('/:id/simulate-payment', requireRole('cashier'), async (req, res) => {
  if (!xendit.isTestMode()) return res.status(404).json({ error: 'Not found' });
  const transaction = await findOwn(req, res);
  if (!transaction) return;
  if (transaction.status !== 'pending' || !transaction.payment?.qrId) {
    return res.status(409).json({ error: 'Transaction is not pending' });
  }
  try {
    await xendit.simulateQrPayment(transaction.payment.qrId, transaction.totalAmount);
    res.json({ transaction: response(await qris.syncWithProvider(transaction)) });
  } catch (error) {
    providerError(res, error);
  }
});

module.exports = router;
