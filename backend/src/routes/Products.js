const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");

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
router.get(
  "/low-stock",
  requireAuth,
  requireRole("admin"),
  async (_req, res) => {
    const products = await Product.find({
      isActive: { $ne: false },
      $expr: { $lte: ["$stock", "$minStock"] },
    }).sort({ stock: 1 });
    res.json({ products });
  },
);

// GET /api/products
router.get("/", requireAuth, async (_req, res) => {
  const products = await Product.find({ isActive: { $ne: false } }).sort({
    createdAt: -1,
    _id: -1,
  });
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
    { _id: req.params.id, isActive: { $ne: false } },
    updates,
    { returnDocument: "after", runValidators: true },
  );
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ product });
});

// POST /api/products/:id/stock-adjustments
router.post(
  "/:id/stock-adjustments",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const { quantity } = req.body ?? {};

    if (!Number.isSafeInteger(quantity) || quantity === 0) {
      return res.status(400).json({
        error: "Quantity must be a non-zero integer",
      });
    }

    const session = await mongoose.startSession();

    try {
      let movement;

      await session.withTransaction(async () => {
        const product = await Product.findOne({
          _id: req.params.id,
          isActive: { $ne: false },
        }).session(session);

        if (!product) {
          const error = new Error("Product not found");
          error.status = 404;
          throw error;
        }

        const stockBefore = product.stock;
        const stockAfter = stockBefore + quantity;

        if (stockAfter < 0) {
          const error = new Error("Stock cannot be negative");
          error.status = 400;
          throw error;
        }

        product.stock = stockAfter;
        await product.save({ session });

        [movement] = await StockMovement.create(
          [
            {
              productId: product._id,
              transactionId: null,
              type: "adjustment",
              quantity,
              stockBefore,
              stockAfter,
            },
          ],
          { session },
        );
      });

      return res.status(201).json({ movement });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }

      throw error;
    } finally {
      await session.endSession();
    }
  },
);

// DELETE /api/products/:id
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, isActive: { $ne: false } },
    { isActive: false, deletedAt: new Date() },
    { returnDocument: "after" },
  );
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ product });
});

module.exports = router;
