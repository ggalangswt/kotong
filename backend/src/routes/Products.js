const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");

// lalu sesuaikan nama fungsi di baris require ini dan pemakaiannya di bawah.
// Kemungkinan namanya requireAuth / requireRole('owner') / isOwner / ownerOnly.
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validPrice(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function validStock(value) {
  return (
    value === undefined ||
    (typeof value === "number" && Number.isFinite(value) && value >= 0)
  );
}

// GET /api/products/low-stock
// PENTING: harus didaftarkan sebelum route dinamis lain kalau nanti ada GET /:id
router.get("/low-stock", requireAuth, async (_req, res) => {
  const products = await Product.find({
    $expr: { $lte: ["$stock", "$minStock"] },
  }).sort({ stock: 1 });
  res.json({ products });
});

// GET /api/products
router.get("/", requireAuth, async (_req, res) => {
  const products = await Product.find().sort({ createdAt: -1, _id: -1 });
  res.json({ products });
});

// POST /api/products
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const name = normalizeText(req.body?.name);
  const category = normalizeText(req.body?.category);
  const { price, stock, minStock } = req.body ?? {};

  if (
    !name ||
    !category ||
    !validPrice(price) ||
    !validStock(stock) ||
    !validStock(minStock)
  ) {
    return res.status(400).json({
      error: "Valid name, category, price, stock, and minStock are required",
    });
  }

  const product = await Product.create({
    name,
    category,
    price,
    stock,
    minStock,
  });
  res.status(201).json({ product });
});

// PATCH /api/products/:id
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  const updates = {};

  if (req.body?.name !== undefined) {
    const name = normalizeText(req.body.name);
    if (!name) return res.status(400).json({ error: "Name cannot be empty" });
    updates.name = name;
  }
  if (req.body?.category !== undefined) {
    const category = normalizeText(req.body.category);
    if (!category)
      return res.status(400).json({ error: "Category cannot be empty" });
    updates.category = category;
  }
  if (req.body?.price !== undefined) {
    if (!validPrice(req.body.price)) {
      return res
        .status(400)
        .json({ error: "Price must be a non-negative number" });
    }
    updates.price = req.body.price;
  }
  if (req.body?.stock !== undefined) {
    if (!validStock(req.body.stock)) {
      return res
        .status(400)
        .json({ error: "Stock must be a non-negative number" });
    }
    updates.stock = req.body.stock;
  }
  if (req.body?.minStock !== undefined) {
    if (!validStock(req.body.minStock)) {
      return res
        .status(400)
        .json({ error: "minStock must be a non-negative number" });
    }
    updates.minStock = req.body.minStock;
  }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id },
    updates,
    {
      returnDocument: "after",
      runValidators: true,
    },
  );
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ product });
});

// DELETE /api/products/:id
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  const product = await Product.findOneAndDelete({ _id: req.params.id });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ product });
});

module.exports = router;
