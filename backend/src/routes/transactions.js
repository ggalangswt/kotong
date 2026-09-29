const express = require('express');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { requireRole } = require('../middleware/auth');

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
  };
}

router.post('/', requireRole('cashier'), async (req, res) => {
  const { items, paymentMethod } = req.body || {};
  if (paymentMethod !== 'cash' || !Array.isArray(items) || items.length === 0 ||
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
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid transaction id' });
  const filter = { _id: req.params.id };
  if (req.user.role === 'cashier') filter.cashierId = req.user.id;
  const transaction = await Transaction.findOne(filter).lean();
  if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
  res.json({ transaction: response(transaction) });
});

module.exports = router;
