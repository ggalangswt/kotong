const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/User");
const Transaction = require("../src/models/Transaction");

test("CSV export requires Admin and includes the selected WIB dates", async () => {
  const mongo = await MongoMemoryServer.create();
  process.env.JWT_SECRET = "report-export-test-secret-thirty-two-characters";
  try {
    await mongoose.connect(mongo.getUri());
    const [admin, cashier] = await User.create(
      ["admin", "cashier"].map((role) => ({
        name: role,
        email: `${role}@example.test`,
        passwordHash: "unused-in-token-test",
        role,
      })),
    );
    const token = (user) => jwt.sign({ sub: user.id }, process.env.JWT_SECRET);
    const exportReport = (query) => request(app).get("/api/reports/export").query(query);
    const range = { start: "2026-11-01", end: "2026-11-02" };

    assert.equal((await exportReport(range)).status, 401);
    assert.equal((await exportReport(range).auth(token(cashier), { type: "bearer" })).status, 403);
    for (const query of [
      { start: range.start },
      { ...range, start: "2026-02-30" },
      { ...range, start: "2026-11-03" },
      { ...range, start: [range.start, range.end] },
    ]) {
      assert.equal((await exportReport(query).auth(token(admin), { type: "bearer" })).status, 400);
    }

    const productId = new mongoose.Types.ObjectId();
    const sales = [
      ["2026-10-31T16:59:59.999Z", "Di luar periode", 1, 999],
      ["2026-10-31T17:00:00.000Z", "Nama lama", 2, 150],
      ["2026-11-02T16:59:59.999Z", '=Contoh, "Kopi"\nSusu', 1, 200],
      ["2026-11-02T17:00:00.000Z", "Di luar periode", 1, 999],
    ];
    await Transaction.create(sales.map(([date, productName, quantity, price]) => ({
      date,
      cashierId: cashier.id,
      paymentMethod: "cash",
      totalAmount: quantity * price,
      items: [{
        productId, productName, quantity, priceAtTransaction: price, subtotal: quantity * price,
      }],
    })));

    const result = await exportReport(range).auth(token(admin), { type: "bearer" });
    assert.equal(result.status, 200);
    assert.match(result.headers["content-type"], /^text\/csv; charset=utf-8$/i);
    assert.equal(result.headers["content-disposition"],
      'attachment; filename="laporan-kotong-2026-11-01-2026-11-02.csv"');
    assert.equal(result.headers["cache-control"], "no-store");
    assert.equal(result.text, [
      '\uFEFF"Bagian","Tanggal (WIB)","Produk","Jumlah Transaksi","Unit Terjual","Omzet (Rp)"',
      '"Total periode","2026-11-01 s.d. 2026-11-02","",2,"",500',
      '"Penjualan harian","2026-11-02","",1,"",200',
      '"Penjualan harian","2026-11-01","",1,"",300',
      `"Produk terlaris","","'=Contoh, ""Kopi""\nSusu","",3,500`,
      "",
    ].join("\r\n"));

    const empty = await exportReport({
      start: "2026-12-01", end: "2026-12-01",
    }).auth(token(admin), { type: "bearer" });
    assert.equal(empty.status, 200);
    assert.match(empty.text, /"Total periode","2026-12-01 s.d. 2026-12-01","",0,"",0/);
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});
