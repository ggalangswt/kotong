const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  priceAtTransaction: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const transactionSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  cashierId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  items: { type: [itemSchema], required: true },
  totalAmount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, required: true, enum: ['cash'] },
});

module.exports = mongoose.model('Transaction', transactionSchema);
