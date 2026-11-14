import { test, expect, type Page } from "@playwright/test";
async function login(page: Page, email: string) {
  await page.goto("/login");
  const isAdmin = email.startsWith("admin");
  await page
    .getByRole("button", { name: isAdmin ? "Admin" : "Kasir", exact: true })
    .click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill("KotongTest123");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
}
async function logout(page: Page) {
  await page.getByRole("button", { name: /^Menu akun/ }).click();
  await page.getByRole("menuitem", { name: "Keluar" }).click();
  await expect(page).toHaveURL(/\/login$/);
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
  const printButton = await page
    .getByRole("button", { name: "Cetak Struk", exact: true })
    .boundingBox();
  const newSaleButton = await page
    .getByRole("button", { name: "Transaksi Baru", exact: true })
    .boundingBox();
  expect(printButton!.height).toBe(newSaleButton!.height);
  expect(printButton!.y).toBe(newSaleButton!.y);
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
  await logout(page);
  await login(page, "budi@example.test");
  await page.getByRole("link", { name: "Riwayat Saya" }).click();
  await expect(page.getByText("Tidak ada hasil")).toBeVisible();
});
test("admin manages products, stock and cashier accounts", async ({ page }) => {
  await login(page, "admin@example.test");
  await expect(
    page.getByRole("heading", { name: "Ringkasan Toko" }),
  ).toBeVisible();
  await expect(page.locator(".summary-strip")).toBeVisible();
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
  await page
    .getByRole("dialog")
    .getByLabel("Email", { exact: true })
    .fill("rina@example.test");
  await page.getByLabel("Kata sandi awal").fill("KotongTest123");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const toast = page
    .getByRole("status")
    .filter({ hasText: "Akun kasir berhasil dibuat." });
  await expect(toast).toBeVisible();
  const position = await toast.boundingBox();
  expect(position!.y).toBeLessThan(90);
  expect(position!.x).toBeGreaterThan(720);
  await expect(
    page.getByRole("row").filter({ hasText: "rina@example.test" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/notifikasi-kanan-atas.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Tutup notifikasi" }).click();
  await expect(toast).toHaveCount(0);
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

test("landing page is public, responsive and leads to login", async ({
  page,
}) => {
  const sessionCalls: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/session"))
      sessionCalls.push(request.url());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Jualan sehari-hari, lebih tertata." }),
  ).toBeVisible();
  await expect(
    page.getByText("Contoh tampilan", { exact: true }),
  ).toBeVisible();
  expect(sessionCalls).toHaveLength(0);
  await page.screenshot({
    path: "test-results/landing-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Lihat cara kerjanya" }).click();
  await expect(page).toHaveURL(/#cara-kerja$/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/landing-mobile.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Masuk", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Siap buka toko?" }),
  ).toBeVisible();
});

test("admin registration auto-logs in and login separates admin vs cashier roles", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("sari@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("KotongTest123");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.locator(".error")).toContainText(
    "Akun ini bukan akun Admin",
  );

  await page.getByRole("link", { name: "Daftar akun Admin" }).click();
  await expect(
    page.getByRole("heading", { name: "Buat akun Admin" }),
  ).toBeVisible();
  // Next keeps the previous /login page mounted but hidden (Activity), so scope to the visible form.
  const form = page.locator("form").filter({ visible: true });
  await form.getByLabel("Nama lengkap").fill("Admin Baru Berkah");
  await form
    .getByLabel("Email", { exact: true })
    .fill("adminbaru@example.test");
  await form.getByLabel("Kata sandi", { exact: true }).fill("KotongTest123");
  await form
    .getByLabel("Konfirmasi kata sandi", { exact: true })
    .fill("KotongTest123");
  await page
    .getByRole("button", { name: "Daftar sebagai Admin", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ringkasan Toko" }),
  ).toBeVisible();
});

test("admin renames the store from the account menu and cashiers see it", async ({
  page,
}) => {
  await login(page, "admin@example.test");
  const sidebar = page.locator(".sidebar");
  await expect(sidebar.locator(".store-label")).toContainText("Toko Saya");
  await expect(page.getByRole("link", { name: "Pengaturan Toko" })).toHaveCount(
    0,
  );

  await page.getByRole("button", { name: /^Menu akun/ }).click();
  const items = page.getByRole("menuitem");
  await expect(items).toHaveText(["Pengaturan Toko", "Keluar"]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);

  await page.getByRole("button", { name: /^Menu akun/ }).click();
  await page.getByRole("menuitem", { name: "Pengaturan Toko" }).click();
  await expect(page).toHaveURL(/\/admin\/toko$/);
  await expect(page.getByRole("menu")).toHaveCount(0);

  await page.getByLabel("Nama toko").fill("Toko Uji Coba");
  await page.getByLabel("Jenis toko").fill("Warung");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Profil toko berhasil disimpan." }),
  ).toBeVisible();
  await expect(sidebar.locator(".store-label")).toContainText("Toko Uji Coba");
  await expect(sidebar.locator(".store-avatar")).toHaveText("T");
  await expect(page.locator(".topbar")).toContainText("Toko Uji Coba");

  await logout(page);
  await login(page, "sari@example.test");
  await expect(page.locator(".sidebar .store-label")).toContainText(
    "Toko Uji Coba",
  );
  await page.getByRole("button", { name: /^Menu akun/ }).click();
  await expect(page.getByRole("menuitem")).toHaveText(["Keluar"]);
  await page.goto("/admin/toko");
  await expect(page).toHaveURL(/kasir\/transaksi/);
});
