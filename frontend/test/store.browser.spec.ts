import { test, expect, type Page } from "@playwright/test";
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill("KotongTest123");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
}
test("cashier sale, receipt and private history work against isolated MongoDB", async ({
  page,
}) => {
  await login(page, "sari@example.test");
  await expect(
    page.getByRole("heading", { name: "Transaksi Baru", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Akun Kasir" })).toHaveCount(0);
  await page.getByRole("button", { name: /Beras Premium 5 kg/ }).click();
  await page
    .getByRole("button", { name: /Makanan Ringan Mi Instan Goreng/ })
    .click();
  await page
    .getByRole("button", { name: "Tambah Mi Instan Goreng", exact: true })
    .click();
  await page.getByLabel("Uang diterima").fill("100000");
  await expect(page.locator(".change-line")).toContainText("15.000");
  await page.getByRole("button", { name: "Selesaikan Transaksi" }).click();
  await expect(
    page.getByRole("heading", { name: "Penjualan berhasil!" }),
  ).toBeVisible();
  await expect(page.locator(".receipt-money")).toContainText("15.000");
  await page.screenshot({
    path: "test-results/kasir-berhasil.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Riwayat Saya" }).click();
  await page.getByRole("button", { name: "Detail", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Beras Premium 5 kg");
  await page.getByRole("button", { name: "Tutup", exact: true }).click();
  await page.getByRole("link", { name: "Transaksi", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Transaksi Baru", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Beras Premium 5 kg/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/kasir-transaksi.png",
    fullPage: true,
  });
  await page.goto("/admin");
  await expect(page).toHaveURL(/kasir\/transaksi/);
  await page.getByRole("button", { name: "Keluar" }).click();
  await login(page, "budi@example.test");
  await page.getByRole("link", { name: "Riwayat Saya" }).click();
  await expect(page.getByText("Tidak ada hasil")).toBeVisible();
});
test("admin manages products, stock and cashier accounts", async ({ page }) => {
  await login(page, "admin@example.test");
  await expect(
    page.getByRole("heading", { name: "Ringkasan Toko" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/admin-ringkasan.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Produk", exact: true }).click();
  await page
    .getByRole("button", { name: "Tambah Produk", exact: true })
    .click();
  await page
    .getByLabel("Nama produk", { exact: true })
    .fill("Sabun Cuci 500 g");
  await page.getByLabel("Kategori", { exact: true }).fill("Kebutuhan Rumah");
  await page.getByLabel("Harga (Rp)", { exact: true }).fill("12000");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText("Sabun Cuci 500 g", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Stok", exact: true }).click();
  await page
    .getByRole("row")
    .filter({ hasText: "Sabun Cuci 500 g" })
    .getByRole("button", { name: "Sesuaikan", exact: true })
    .click();
  await page.getByLabel("Jumlah stok baru").fill("10");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Riwayat Sabun Cuci 500 g" }).click();
  await expect(page.getByRole("dialog")).toContainText("Penyesuaian");
  await page.getByRole("button", { name: "Tutup", exact: true }).click();
  await page.getByRole("link", { name: "Laporan", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Penjualan harian" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/admin-laporan.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Akun Kasir", exact: true }).click();
  await page.getByRole("button", { name: "Tambah Akun Kasir" }).click();
  await page.getByLabel("Nama kasir", { exact: true }).fill("Rina");
  await page.getByLabel("Email", { exact: true }).fill("rina@example.test");
  await page.getByLabel("Kata sandi awal").fill("KotongTest123");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("row")
    .filter({ hasText: "rina@example.test" })
    .getByRole("button", { name: "Nonaktifkan" })
    .click();
  await page.getByRole("button", { name: "Ya, Ubah Status" }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "rina@example.test" }),
  ).toContainText("Nonaktif");
  await page.setViewportSize({ width: 1024, height: 768 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
test("gateway rejects unauthenticated and cross-origin mutations", async ({
  request,
}) => {
  const unauth = await request.get("/api/products");
  expect(unauth.status()).toBe(401);
  const csrf = await request.post("/api/auth/login", {
    headers: { Origin: "https://untrusted.example" },
    data: { email: "admin@example.test", password: "KotongTest123" },
  });
  expect(csrf.status()).toBe(403);
  const unknown = await request.get("/api/unknown");
  expect(unknown.status()).toBe(404);
});
