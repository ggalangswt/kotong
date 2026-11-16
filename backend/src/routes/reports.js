const express = require("express");
const Transaction = require("../models/Transaction");
const { UNPAID_STATUSES } = Transaction;

const router = express.Router();

function reportDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return null;
  }
  return new Date(`${value}T00:00:00+07:00`);
}

function csvCell(value) {
  if (typeof value === "number") return String(value);
  // Keep product names as text when the CSV is opened in a spreadsheet.
  const text = /^[\r\n\t]|^\s*[=+@\-＝＋＠－]/u.test(value) ? `'${value}` : value;
  return `"${text.replaceAll('"', '""')}"`;
}

router.get("/export", async (req, res) => {
  const { start, end } = req.query;
  const firstDay = reportDate(start);
  const lastDay = reportDate(end);
  if (!firstDay || !lastDay || firstDay > lastDay) {
    return res.status(400).json({ error: "Invalid report date range" });
  }
  const endExclusive = new Date(lastDay.getTime() + 86_400_000);
  const [{ daily, products }] = await Transaction.aggregate([
    { $match: { status: { $nin: UNPAID_STATUSES }, date: { $gte: firstDay, $lt: endExclusive } } },
    {
      $facet: {
        daily: [
          {
            $group: {
              _id: {
                $dateToString: { date: "$date", format: "%Y-%m-%d", timezone: "Asia/Jakarta" },
              },
              count: { $sum: 1 },
              revenue: { $sum: "$totalAmount" },
            },
          },
          { $sort: { _id: -1 } },
        ],
        products: [
          { $sort: { date: -1, _id: -1 } },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.productId",
              name: { $first: "$items.productName" },
              quantity: { $sum: "$items.quantity" },
              revenue: { $sum: "$items.subtotal" },
            },
          },
          { $sort: { quantity: -1, revenue: -1, _id: 1 } },
        ],
      },
    },
  ]);

  const rows = [
    ["Bagian", "Tanggal (WIB)", "Produk", "Jumlah Transaksi", "Unit Terjual", "Omzet (Rp)"],
    [
      "Total periode",
      `${start} s.d. ${end}`,
      "",
      daily.reduce((sum, day) => sum + day.count, 0),
      "",
      daily.reduce((sum, day) => sum + day.revenue, 0),
    ],
    ...daily.map((day) => ["Penjualan harian", day._id, "", day.count, "", day.revenue]),
    ...products.map((product) => [
      "Produk terlaris", "", product.name, "", product.quantity, product.revenue,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  res.attachment(`laporan-kotong-${start}-${end}.csv`);
  res.set("Cache-Control", "no-store");
  res.type("text/csv").send(`\uFEFF${csv}\r\n`);
});

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
        status: { $nin: UNPAID_STATUSES },
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
    { $match: { status: { $nin: UNPAID_STATUSES } } },
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
