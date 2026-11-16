import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cashSuggestions,
  change,
  day,
  report,
  shortRupiah,
} from "../src/lib/business";
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
test("quick cash suggestions are common notes and round-ups above the total", () => {
  assert.deepEqual(cashSuggestions(8000), [10000, 20000, 50000, 100000]);
  assert.deepEqual(cashSuggestions(16000), [20000, 50000, 100000]);
  assert.deepEqual(cashSuggestions(78000), [80000, 100000]);
  assert.deepEqual(cashSuggestions(123000), [130000, 150000, 200000]);
  assert.deepEqual(cashSuggestions(20000), [50000, 100000]);
  assert.deepEqual(cashSuggestions(0), []);
});
test("short rupiah labels for quick cash buttons", () => {
  assert.equal(shortRupiah(20000), "20rb");
  assert.equal(shortRupiah(150000), "150rb");
  assert.equal(shortRupiah(2500), "2,5rb");
});
