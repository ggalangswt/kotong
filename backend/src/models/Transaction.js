const mongoose = require('mongoose');

const PAYMENT_METHODS = ['cash', 'qris'];
// Only `paid` transactions count as revenue. Legacy documents without a status are cash sales, i.e. paid.
const TRANSACTION_STATUSES = ['paid', 'pending', 'expired', 'cancelled', 'failed'];
const UNPAID_STATUSES = ['pending', 'expired', 'cancelled', 'failed'];

const itemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  priceAtTransaction: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  provider: { type: String, enum: ['xendit'], required: true },
  qrId: { type: String },
  qrString: { type: String },
  expiresAt: { type: Date },
  paidAt: { type: Date },
  providerPaymentId: { type: String },
}, { _id: false });

const transactionSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  cashierId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  items: { type: [itemSchema], required: true },
  totalAmount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, required: true, enum: PAYMENT_METHODS },
  status: { type: String, required: true, enum: TRANSACTION_STATUSES, default: 'paid' },
  payment: { type: paymentSchema },
});

transactionSchema.index({ 'payment.qrId': 1 }, { sparse: true });

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
module.exports.UNPAID_STATUSES = UNPAID_STATUSES;
