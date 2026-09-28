# Kotong backend

Backend menggunakan Express 5, MongoDB, dan token Bearer JWT. Node.js 20.19+ diperlukan oleh Mongoose 9.

## Menjalankan

1. Jalankan MongoDB lokal atau siapkan URI MongoDB lain.
2. Jalankan `npm install` di folder `backend`.
3. Salin `.env.example` menjadi `.env`, lalu isi `MONGODB_URI`, `JWT_SECRET` (minimal 32 karakter acak), dan kredensial Admin. Jangan commit `.env`.
4. Jalankan `npm run seed:admin` sekali untuk membuat Admin awal. Menjalankannya lagi tidak mengubah Admin yang sudah ada.
5. Jalankan `npm run dev` atau `npm start`. Server baru listen setelah koneksi MongoDB berhasil.

## Kontrak API bagian Galang

Kirim body JSON dengan `Content-Type: application/json`. Endpoint terlindungi memakai header `Authorization: Bearer <token>`.

| Endpoint | Body | Respons sukses | Akses |
| --- | --- | --- | --- |
| `POST /api/auth/login` | `{ "email": "admin@example.com", "password": "..." }` | `200 { "token": "...", "user": { ... } }` | Publik; akun aktif |
| `POST /api/cashiers` | `{ "name": "Kasir Satu", "email": "kasir@example.com", "password": "..." }` | `201 { "cashier": { ... } }` | Admin |
| `GET /api/cashiers` | — | `200 { "cashiers": [ ... ] }` | Admin |
| `PATCH /api/cashiers/:id/status` | `{ "status": "inactive" }` atau `active` | `200 { "cashier": { ... } }` | Admin |

Objek `user` dan `cashier` berisi `id`, `name`, `email`, `role`, `status`, `createdAt`, dan `updatedAt`. Password dan hash tidak dikirim. Email disimpan dalam huruf kecil. Nama wajib 1–100 karakter, password awal Kasir 8–128 karakter. Token berlaku 8 jam; menonaktifkan akun langsung menolak token yang masih berlaku.

Semua error berbentuk `{ "error": "pesan" }`. Kode utama: `400` input salah, `401` login salah atau token tidak valid/akun nonaktif, `403` role tidak berhak, `404` ID Kasir tidak ditemukan, `409` email sudah dipakai, dan `429` terlalu banyak percobaan login (10 kegagalan per 15 menit per IP). Endpoint lain masih `501` setelah lolos pemeriksaan akses.

## Integrasi modul anggota lain

Impor `{ requireAuth, requireRole }` dari `src/middleware/auth.js`. Pasang berurutan, misalnya `router.post('/', requireAuth, requireRole('admin'), handler)`. Setelah `requireAuth`, `req.user` berisi `{ id, name, email, role }` dari database terkini. Implementasi riwayat transaksi oleh Diaz perlu membatasi query Kasir ke `req.user.id`; Admin dapat melihat seluruh riwayat. Kasir dapat melihat produk dan membuat transaksi. Admin mengelola Kasir, produk, stok, dan laporan.

Route produk, transaksi, dan laporan sekarang berupa stub di `src/app.js`. Saat menggantinya, pertahankan middleware akses. Route `/api/products/low-stock` harus didaftarkan sebelum `/api/products/:id`.

File `postman/Kotong-Galang.postman_collection.json` berisi contoh request. Login Admin menyimpan token ke variabel koleksi `token` secara otomatis.

## Uji

Jalankan `npm test`. Pengujian integrasi menggunakan MongoDB sementara melalui `mongodb-memory-server`; unduhan binary MongoDB diperlukan pada run pertama.
