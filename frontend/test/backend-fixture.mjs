import { createRequire } from "node:module";
const require = createRequire(
  new URL("../../backend/package.json", import.meta.url),
);
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const argon2 = require("argon2");
process.env.JWT_SECRET = "kotong-isolated-browser-test-secret-only";
const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
await mongoose.connect(mongo.getUri());
const User = require("./src/models/User");
const Product = require("./src/models/Product");
const passwordHash = await argon2.hash("KotongTest123");
await User.create([
  {
    name: "Admin Berkah",
    email: "admin@example.test",
    passwordHash,
    role: "admin",
  },
  { name: "Sari", email: "sari@example.test", passwordHash, role: "cashier" },
  { name: "Budi", email: "budi@example.test", passwordHash, role: "cashier" },
]);
await Product.create([
  {
    name: "Beras Premium 5 kg",
    category: "Sembako",
    price: 78000,
    stock: 12,
    minStock: 5,
  },
  {
    name: "Minyak Goreng 1 L",
    category: "Sembako",
    price: 18000,
    stock: 8,
    minStock: 5,
  },
  {
    name: "Gula Pasir 1 kg",
    category: "Sembako",
    price: 17000,
    stock: 15,
    minStock: 5,
  },
  {
    name: "Mi Instan Goreng",
    category: "Makanan Ringan",
    price: 3500,
    stock: 24,
    minStock: 5,
  },
  {
    name: "Teh Celup",
    category: "Minuman",
    price: 8000,
    stock: 4,
    minStock: 5,
  },
]);
const app = require("./src/app");
const server = app.listen(4015, "127.0.0.1", () =>
  console.log("Kotong isolated test API ready"),
);
async function stop() {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
  process.exit(0);
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
