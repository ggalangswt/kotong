const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const xendit = require('./xendit');

const QR_LIFETIME_MS = 15 * 60 * 1000;

// Marks a pending QRIS sale as paid. Idempotent: only the first caller wins.
async function markPaid(transactionId, { paidAt, providerPaymentId }) {
  return Transaction.findOneAndUpdate(
    { _id: transactionId, status: 'pending' },
    { $set: { status: 'paid', 'payment.paidAt': paidAt || new Date(), 'payment.providerPaymentId': providerPaymentId } },
    { returnDocument: 'after' },
  );
}

// Moves a pending sale to a final unpaid status and returns its reserved stock. Idempotent.
async function releasePending(transactionId, status) {
  return mongoose.connection.transaction(async session => {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: transactionId, status: 'pending' },
      { $set: { status } },
      { returnDocument: 'after', session },
    );
    if (!transaction) return null;

    const products = mongoose.connection.collection('products');
    const movements = [];
    for (const item of transaction.items) {
      const before = await products.findOneAndUpdate(
        { _id: item.productId },
        { $inc: { stock: item.quantity } },
        { session, returnDocument: 'before' },
      );
      if (!before) continue; // product was hard-deleted; nothing to restore
      movements.push({
        productId: item.productId,
        transactionId: transaction._id,
        type: 'sale_reversal',
        quantity: item.quantity,
        stockBefore: before.stock,
        stockAfter: before.stock + item.quantity,
        createdAt: new Date(),
      });
    }
    if (movements.length) {
      await mongoose.connection.collection('stockmovements').insertMany(movements, { session });
    }
    return transaction;
  });
}

async function attachQrCode(transaction) {
  const expiresAt = new Date(Date.now() + QR_LIFETIME_MS);
  const qr = await xendit.createQrCode({
    referenceId: String(transaction._id),
    amount: transaction.totalAmount,
    expiresAt,
  });
  return Transaction.findByIdAndUpdate(transaction._id, {
    $set: {
      payment: {
        provider: 'xendit',
        qrId: qr.id,
        qrString: qr.qr_string,
        expiresAt: qr.expires_at ? new Date(qr.expires_at) : expiresAt,
      },
    },
  }, { returnDocument: 'after' });
}

// Pulls the latest payment state from Xendit. Used when webhooks cannot reach the server (e.g. local dev).
async function syncWithProvider(transaction) {
  if (transaction.status !== 'pending' || !transaction.payment?.qrId) return transaction;

  const payments = await xendit.listQrPayments(transaction.payment.qrId);
  const succeeded = payments.find(payment => payment.status === 'SUCCEEDED');
  if (succeeded) {
    return (await markPaid(transaction._id, {
      paidAt: succeeded.created ? new Date(succeeded.created) : undefined,
      providerPaymentId: succeeded.id,
    })) || Transaction.findById(transaction._id);
  }
  if (transaction.payment.expiresAt && transaction.payment.expiresAt <= new Date()) {
    return (await releasePending(transaction._id, 'expired')) || Transaction.findById(transaction._id);
  }
  return transaction;
}

module.exports = { markPaid, releasePending, attachQrCode, syncWithProvider };
