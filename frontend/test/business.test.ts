import { test } from "node:test";
import assert from "node:assert/strict";
import { change, day, report } from "../src/lib/business";
import type { Sale } from "../src/lib/types";
test("cash change validates whole rupiah and sufficient payment", () => {
  assert.equal(change(85000, 100000), 15000);
  assert.equal(change(85000, 84000), null);
  assert.equal(change(85000, 100000.5), null);
});
test("WIB boundary and period reports use recorded product prices", () => {
  const sale: Sale = {
    id: "1",
    date: "2026-11-08T17:01:00Z",
    cashierId: "a",
    paymentMethod: "cash",
    totalAmount: 85000,
    items: [
      {
        productId: "old-product",
        productName: "Beras Premium 5 kg",
        quantity: 1,
        priceAtTransaction: 78000,
        subtotal: 78000,
      },
      {
        productId: "mi",
        productName: "Mi Instan Goreng",
        quantity: 2,
        priceAtTransaction: 3500,
        subtotal: 7000,
      },
    ],
  };
  assert.equal(day(sale.date), "2026-11-09");
  assert.equal(report([sale], "2026-11-08", "2026-11-08").revenue, 0);
  const result = report([sale], "2026-11-09", "2026-11-09");
  assert.equal(result.revenue, 85000);
  assert.equal(result.products[0].quantity, 2);
  assert.equal(result.daily[0].count, 1);
  assert.equal(report([], "2026-11-09", "2026-11-09").revenue, 0);
});
