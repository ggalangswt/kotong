const crypto = require('node:crypto');
const express = require('express');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const qris = require('../services/qrisPayments');

const router = express.Router();

function validToken(received) {
  const expected = process.env.XENDIT_CALLBACK_TOKEN;
  if (!expected || typeof received !== 'string' || received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

// Xendit `qr.payment` webhook. Configure the URL in Dashboard > Settings > Webhooks.
router.post('/webhook', async (req, res) => {
  if (!validToken(req.get('x-callback-token'))) return res.status(401).json({ error: 'Invalid callback token' });

  const { event, data } = req.body || {};
  if (event !== 'qr.payment' || !data || data.status !== 'SUCCEEDED') return res.json({ ok: true });

  const referenceId = data.qr_code?.reference_id || data.reference_id;
  if (!mongoose.isValidObjectId(referenceId)) return res.json({ ok: true });

  const transaction = await Transaction.findOne({ _id: referenceId, paymentMethod: 'qris' });
  if (!transaction) return res.json({ ok: true });
  if (transaction.totalAmount !== data.amount || (data.qr_id && data.qr_id !== transaction.payment?.qrId)) {
    console.error('QRIS webhook mismatch for transaction', referenceId);
    return res.json({ ok: true });
  }

  await qris.markPaid(transaction._id, {
    paidAt: data.created ? new Date(data.created) : undefined,
    providerPaymentId: data.id,
  });
  res.json({ ok: true });
});

module.exports = router;
