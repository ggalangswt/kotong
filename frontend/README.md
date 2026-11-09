# Frontend KOTONG

Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui (Base UI), HeroUI, dan Plus Jakarta Sans lokal. Antarmuka berbahasa Indonesia untuk admin dan kasir, dengan light mode lavender, biru, krem, serta charcoal.

## Menjalankan

Gunakan Node.js 22+ dan npm. Backend Express tetap dijalankan terpisah pada port 4000; MongoDB harus mendukung transaksi multi-dokumen (replica set atau Atlas).

```bash
cd frontend
npm install
cp .env.example .env.local
openssl rand -hex 32
```

Isi `SESSION_SECRET` dengan hasil perintah terakhir (minimal 32 karakter). Isi `KOTONG_API_URL` dengan origin backend tanpa `/api`, misalnya `http://localhost:4000`. Jangan membagikan `.env.local` atau rahasianya. Pada checkout pengembangan ini `.env.local` sudah dibuat dan diabaikan Git.

```bash
npm run dev
```

Buka http://localhost:3000/login. Gunakan akun dari backend; tidak ada akun demo dalam aplikasi. Admin awal dibuat melalui `npm run seed:admin` di backend sesuai dokumentasi backend. Hentikan server dengan Ctrl+C.

## Pemeriksaan

```bash
npm run lint
npm test
npm run build
npm run test:browser
```

Tes browser membutuhkan Google Chrome dan dependensi backend yang sudah terpasang. Tes menyalakan Express asli dengan MongoDB replica set sementara, mengisi data pengujian, lalu membuka Next.js di port 3015. Port 4015 dan 3015 harus bebas. Build pengujian menggunakan `.next-test/` agar server pengembangan utama tetap dapat berjalan. Database toko tidak digunakan. Binary MongoDB dapat diunduh otomatis saat pertama kali tes. Screenshot dan trace disimpan di `test-results/` dan tidak masuk Git.

## Perilaku integrasi

- JWT berada di cookie HttpOnly yang ditandatangani; route handler Next.js meneruskan Bearer token ke endpoint Express yang diizinkan. Mutasi menolak origin berbeda. Otorisasi final dan validasi stok dilakukan backend.
- Kasir hanya memiliki menu penjualan dan riwayat sendiri; admin memiliki ringkasan, produk, stok, transaksi, laporan, dan akun kasir.
- Backend hanya menyimpan pembayaran tunai dan total penjualan. Uang diterima/kembalian pada struk baru disimpan di sessionStorage tab, bukan database. Riwayat lama menampilkan total dan harga snapshot tanpa mengarang nominal tunai.
- Laporan periode dihitung dari transaksi yang dikembalikan API, memakai batas hari Asia/Jakarta. Untuk volume besar, diperlukan API laporan dengan filter dan pagination server.
- Stok menipis mengikuti backend: stok kurang dari atau sama dengan minimum. UI menerima stok akhir lalu mengirim selisih ke API. Penyesuaian bersamaan belum dilindungi pemeriksaan versi stok.
- Produk baru memiliki stok nol. Isi persediaan lewat halaman Stok. Menghapus produk tidak menghapus transaksi historis.
- Catatan/pelaku penyesuaian, QRIS, ekspor laporan, dan perubahan backend belum termasuk. Struk dapat dicetak melalui dialog cetak browser.
- Request pembayaran tidak dicoba ulang otomatis. Bila koneksi terputus saat pembayaran, periksa riwayat sebelum mencoba lagi karena backend belum menyediakan idempotency key.

## Struktur kode frontend

- `components/store-app.tsx`: sesi pengguna, pengalihan peran, dan titik masuk aplikasi.
- `components/layout/`: sidebar, header aplikasi, dan konfigurasi navigasi.
- `components/shared/`: identitas KOTONG, status, empty state, tabel, field, filter tanggal, serta aksi form yang digunakan bersama.
- `components/auth/`, `cashier/`, `products/`, `stock/`, `transactions/`, `reports/`, dan `cashiers/`: tampilan dan form masing-masing fitur.
- `components/workspace/`: pengelolaan state, pemilihan halaman, dan wadah dialog bersama. Tampilan fitur menerima props bertipe sesuai data yang dipakai.
- `lib/api.ts`: pemanggilan API browser dan penanganan error/sesi kedaluwarsa. `lib/business.ts` berisi perhitungan uang dan laporan.
