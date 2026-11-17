# Kotong Backend

REST API untuk aplikasi kasir Kotong: autentikasi Admin/Kasir, manajemen produk & stok, transaksi tunai dan QRIS (Xendit), serta laporan penjualan.

**Stack:** Node.js · Express 5 · MongoDB (Mongoose 9) · JWT · Argon2

## Prasyarat

- **Node.js 20.19+** (wajib untuk Mongoose 9)
- **MongoDB** yang mendukung transaksi multi-dokumen, yaitu **replica set** atau **MongoDB Atlas**. MongoDB standalone tidak cukup karena transaksi dan penyesuaian stok memakai MongoDB transaction.
- (Opsional) Akun **Xendit** untuk pembayaran QRIS

## Mulai Cepat

```bash
cd backend
npm install
cp .env.example .env        # Windows (PowerShell): Copy-Item .env.example .env
```

Isi `.env` (lihat tabel di bawah), lalu:

```bash
npm run seed:admin          # buat akun Admin awal (sekali saja)
npm run dev                 # mode development (auto-reload)
```

Server berjalan di `http://localhost:4000` (atau sesuai `PORT`) dan baru menerima request setelah koneksi MongoDB berhasil.

## Environment Variables

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `PORT` | Tidak | Port server, default `4000` |
| `MONGODB_URI` | Ya | Connection string MongoDB, misalnya `mongodb://127.0.0.1:27017/kotong?replicaSet=rs0` atau URI Atlas |
| `JWT_SECRET` | Ya | String acak minimal 32 karakter |
| `ADMIN_NAME` | Untuk seed | Nama Admin awal |
| `ADMIN_EMAIL` | Untuk seed | Email Admin awal |
| `ADMIN_PASSWORD` | Untuk seed | Password Admin awal (8–128 karakter) |
| `XENDIT_SECRET_KEY` | Untuk QRIS | Secret key Xendit (Dashboard → Settings → API Keys, butuh izin Write untuk QR Codes). Key `xnd_development_…` mengaktifkan mode test. |
| `XENDIT_CALLBACK_TOKEN` | Untuk QRIS | Verification token webhook (Dashboard → Settings → Webhooks) |

Membuat `JWT_SECRET` acak:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> Jangan commit file `.env`.

## Scripts

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Jalankan server dengan auto-reload (`node --watch`) |
| `npm start` | Jalankan server untuk production |
| `npm run seed:admin` | Buat Admin awal dari env. Aman dijalankan ulang, Admin yang sudah ada tidak diubah. |
| `npm test` | Jalankan seluruh test |

## Struktur Folder

```
backend/
├── server.js            # entry point: validasi env, koneksi DB, listen
├── src/
│   ├── app.js           # konfigurasi Express & registrasi route
│   ├── db.js            # koneksi MongoDB (lazy, aman untuk serverless)
│   ├── middleware/      # requireAuth, requireRole
│   ├── models/          # User, Product, StockMovement, Transaction, Store
│   ├── routes/          # handler endpoint per resource
│   ├── services/        # integrasi Xendit & logika QRIS
│   └── utils/           # validasi & helper response
├── scripts/             # seed-admin
├── test/                # integration test (node:test + supertest)
└── postman/             # koleksi Postman
```

## Autentikasi & Otorisasi

- Kirim body JSON dengan header `Content-Type: application/json`.
- Endpoint terlindungi memakai header `Authorization: Bearer <token>`.
- Token berlaku **8 jam**. Akun yang dinonaktifkan langsung ditolak walaupun tokennya masih berlaku.
- Ada dua role: **`admin`** (kelola kasir, produk, stok, laporan, profil toko) dan **`cashier`** (lihat produk, buat transaksi).
- Login dan register dibatasi **10 percobaan gagal per 15 menit per IP**.

## Format Error

Semua error berbentuk:

```json
{ "error": "pesan error" }
```

| Kode | Arti |
| --- | --- |
| `400` | Input tidak valid |
| `401` | Login salah, token tidak valid/kedaluwarsa, atau akun nonaktif |
| `403` | Role tidak berhak mengakses |
| `404` | Data tidak ditemukan |
| `409` | Konflik (email sudah dipakai, stok tidak cukup, status transaksi tidak sesuai) |
| `413` | Body request terlalu besar (maks. 1 MB) |
| `429` | Terlalu banyak percobaan login/register |
| `502` | Penyedia pembayaran (Xendit) tidak tersedia |

## Referensi API

Base URL: `/api`

### Auth

| Method | Endpoint | Akses | Keterangan |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Publik | Daftar akun Admin baru. Body: `{ name, email, password }` |
| `POST` | `/auth/login` | Publik | Body: `{ email, password, role? }`. Respons: `{ token, user }` |

Objek `user` berisi `id`, `name`, `email`, `role`, `status`, `createdAt`, `updatedAt`. Password tidak pernah dikirim, dan email disimpan dalam huruf kecil.

### Kasir

| Method | Endpoint | Akses | Keterangan |
| --- | --- | --- | --- |
| `GET` | `/cashiers` | Admin | Daftar kasir |
| `POST` | `/cashiers` | Admin | Body: `{ name, email, password }` |
| `PATCH` | `/cashiers/:id/status` | Admin | Body: `{ status: "active" \| "inactive" }` |

### Profil Toko

| Method | Endpoint | Akses | Keterangan |
| --- | --- | --- | --- |
| `GET` | `/store` | Admin, Kasir | Ambil nama & jenis toko |
| `PATCH` | `/store` | Admin | Body: `{ name?, type? }` |

### Produk & Stok

| Method | Endpoint | Akses | Keterangan |
| --- | --- | --- | --- |
| `GET` | `/products` | Admin, Kasir | Daftar produk aktif |
| `GET` | `/products/low-stock` | Admin | Produk dengan `stock <= minStock` |
| `POST` | `/products` | Admin | Body: `{ name, category, price, stock?, minStock? }` |
| `PATCH` | `/products/:id` | Admin | Ubah data produk |
| `DELETE` | `/products/:id` | Admin | Hapus produk (soft delete) |
| `POST` | `/products/:id/stock-adjustments` | Admin | Body: `{ quantity }`, bilangan bulat ≠ 0 (positif = tambah, negatif = kurang) |
| `GET` | `/products/:id/stock-movements` | Admin | Riwayat pergerakan stok |

Harga dalam **rupiah (bilangan bulat)**.

### Transaksi

| Method | Endpoint | Akses | Keterangan |
| --- | --- | --- | --- |
| `POST` | `/transactions` | Kasir | Buat transaksi, lihat body di bawah |
| `GET` | `/transactions` | Admin, Kasir | Daftar transaksi, terbaru dahulu |
| `GET` | `/transactions/:id` | Admin, Kasir | Detail transaksi |
| `GET` | `/transactions/:id/payment` | Admin, Kasir | Sinkronkan status pembayaran QRIS ke Xendit |
| `POST` | `/transactions/:id/cancel` | Kasir | Batalkan transaksi QRIS yang masih `pending` |
| `POST` | `/transactions/:id/simulate-payment` | Kasir | **Mode test saja**: simulasikan pembayaran QRIS |

Body membuat transaksi:

```json
{
  "paymentMethod": "cash",
  "items": [{ "productId": "<ObjectId>", "quantity": 2 }]
}
```

- `paymentMethod`: `cash` atau `qris`.
- Satu produk tidak boleh muncul dua kali dalam `items`.
- Harga diambil dari data produk di server, bukan dari request.
- Kasir hanya bisa melihat transaksinya sendiri. Admin bisa melihat semua transaksi.
- Status transaksi: `paid`, `pending`, `expired`, `cancelled`, `failed`. Transaksi tunai langsung `paid`, sedangkan QRIS mulai dari `pending` sampai dibayar.
- Pengurangan stok, penyimpanan transaksi, dan pencatatan `StockMovement` berjalan dalam satu MongoDB transaction.

### Laporan

| Method | Endpoint | Akses | Keterangan |
| --- | --- | --- | --- |
| `GET` | `/reports/daily-revenue?date=YYYY-MM-DD` | Admin | Pendapatan harian |
| `GET` | `/reports/best-sellers` | Admin | Produk terlaris |
| `GET` | `/reports/export?start=YYYY-MM-DD&end=YYYY-MM-DD` | Admin | Unduh CSV berisi total periode, penjualan harian, dan produk terlaris |

Rentang tanggal export bersifat inklusif dan dihitung dalam zona waktu **WIB**. Laporan hanya menghitung transaksi berstatus `paid`.

### Webhook Pembayaran

| Method | Endpoint | Akses | Keterangan |
| --- | --- | --- | --- |
| `POST` | `/payments/webhook` | Xendit | Menerima event `qr.payment`, diverifikasi lewat header `x-callback-token` |

Daftarkan URL `https://<domain-backend>/api/payments/webhook` di Dashboard Xendit → Settings → Webhooks. Untuk development lokal, ekspos server dengan tunnel (misalnya ngrok atau Cloudflare Tunnel).

## Testing

```bash
npm test
```

Test integrasi memakai MongoDB in-memory (`mongodb-memory-server`), jadi tidak butuh database sungguhan. Run pertama akan mengunduh binary MongoDB dan butuh koneksi internet.

## Postman

Koleksi request contoh ada di folder [`postman/`](postman/). Import ke Postman, lalu isi variabel koleksi (base URL, kredensial, `productId`) sesuai environment Anda. Request login menyimpan token ke variabel `token` secara otomatis.

> Request yang membuat transaksi akan benar-benar mengubah data dan stok di database yang terhubung.

## Deployment

`src/app.js` meng-export instance Express tanpa memanggil `listen`, dan koneksi database dibuka secara lazy. Karena itu backend bisa dijalankan sebagai server biasa (`npm start`) maupun di platform serverless seperti Vercel. Pastikan semua environment variable di atas sudah diset di platform tujuan.
