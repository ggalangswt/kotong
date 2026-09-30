const express = require("express");
const Transaction = require("../models/Transaction");

const router = express.Router();

// GET /api/reports/daily-revenue
router.get("/daily-revenue", async (req, res) => {
  const { date } = req.query;

  let startDate;
  let endDate;

  if (date) {
    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        error: "Invalid date",
      });
    }

    startDate = parsedDate;
    endDate = new Date(parsedDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);
  } else {
    const now = new Date();

    startDate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
      ),
    );

    endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);
  }

  const result = await Transaction.aggregate([
    {
      $match: {
        date: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    },
    {
      $group: {
        _id: null,
        transactionCount: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  const report = result[0] || {
    transactionCount: 0,
    totalRevenue: 0,
  };

  res.json({
    date: startDate.toISOString().slice(0, 10),
    transactionCount: report.transactionCount,
    totalRevenue: report.totalRevenue,
  });
});

// GET /api/reports/best-sellers
router.get("/best-sellers", async (_req, res) => {
  const products = await Transaction.aggregate([
    {
      $unwind: "$items",
    },
    {
      $group: {
        _id: "$items.productId",
        productName: { $first: "$items.productName" },
        totalQuantity: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.subtotal" },
      },
    },
    {
      $sort: {
        totalQuantity: -1,
        totalRevenue: -1,
      },
    },
  ]);

  res.json({
    products: products.map((product) => ({
      productId: String(product._id),
      productName: product.productName,
      totalQuantity: product.totalQuantity,
      totalRevenue: product.totalRevenue,
    })),
  });
});

module.exports = router;