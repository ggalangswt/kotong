# Kotong

Sistem kasir berbasis web untuk usaha kelontong — menyatukan katalog produk, stok, transaksi, dan laporan penjualan dalam satu aplikasi.

## Latar Belakang

Toko kelontong seringkali mencatat penjualan di dua tempat berbeda: sebagian di buku catatan, sebagian di HP. Akibatnya stok tidak sesuai dengan barang di rak, pemilik tidak tahu produk mana yang paling laku, dan penyusunan laporan harian menjadi pekerjaan manual yang melelahkan.

**Kotong** hadir sebagai satu sistem kasir yang menyatukan seluruh proses tersebut: pengelolaan produk & stok, pencatatan transaksi otomatis, peringatan stok menipis, dan laporan penjualan harian — lengkap dengan pembagian wewenang antara pemilik dan kasir.

## Fitur Utama

- **Manajemen Produk** — kelola nama, kategori, harga, dan stok produk (CRUD penuh)
- **Transaksi Otomatis** — setiap transaksi mengurangi stok secara otomatis dan real-time
- **Peringatan Stok Menipis** — notifikasi saat stok produk turun di bawah ambang batas
- **Laporan Penjualan** — omzet harian dan daftar produk terlaris
- **Role-Based Access** — pemilik mengelola produk & laporan, kasir hanya menjalankan transaksi
- **Autentikasi Aman** — kata sandi tersimpan dalam bentuk hashing

### Fitur Tambahan (opsional)

- Pembayaran QRIS / payment gateway
- Pemindaian barcode
- Ekspor laporan (PDF/Excel/CSV)

## Tech Stack

| Layer    | Teknologi           |
| -------- | ------------------- |
| Backend  | ExpressJS (Node.js) |
| Database | MongoDB             |
| Frontend | React / Next.js     |

## Struktur Proyek

```
kotong/
├── backend/          # ExpressJS API, model MongoDB, middleware autentikasi & otorisasi
├── frontend/          # Aplikasi React/Next.js
└── README.md
```

## Instalasi & Menjalankan Proyek

```bash
# Clone repository
git clone https://github.com/<username>/kotong.git
cd kotong

# Setup backend
cd backend
npm install
npm run dev

# Setup frontend
cd ../frontend
npm install
npm run dev
```

Buat file `.env` pada masing-masing folder (`backend` dan `frontend`) sesuai contoh di `.env.example`.

## Peran Pengguna

| Peran               | Akses                                                              |
| ------------------- | ------------------------------------------------------------------ |
| **Admin (Admin)** | Kelola produk, atur harga & stok, lihat laporan, kelola akun kasir |
| **Kasir (Cashier)** | Menjalankan transaksi penjualan                                    |

## Anggota Tim

1. Project Manager: Ninda Alifa Rachmayanti (24/545484/TK/60679)
2. Front End: Monica Anastasya Dantina (24/544527/TK/60525)
3. Front End: Diaz Amantajati Susilo (24/545483/TK/60678)
4. Back End: Galang Swastika Ramadhan (24/538251/TK/59692)
