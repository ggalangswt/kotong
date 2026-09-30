const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },

    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },

    type: {
      type: String,
      required: true,
      enum: ["sale", "adjustment"],
    },

    quantity: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isSafeInteger,
        message: "Quantity must be an integer",
      },
    },

    stockBefore: {
      type: Number,
      required: true,
      min: 0,
    },

    stockAfter: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

module.exports = mongoose.model("StockMovement", stockMovementSchema);