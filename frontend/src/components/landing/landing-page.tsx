import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Package,
  ReceiptText,
  ShoppingBasket,
  Store,
  Users,
  ChartNoAxesColumn,
  Boxes,
} from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { buttonVariants } from "@/components/ui/button";
import { rupiah } from "@/lib/business";
import "./landing.css";

const benefits = [
  {
    icon: ShoppingBasket,
    number: "01",
    title: "Layani belanja dengan lancar.",
    text: "Cari produk, susun keranjang, lalu terima pembayaran tunai. Total dan kembalian langsung terlihat.",
  },
  {
    icon: Boxes,
    number: "02",
    title: "Tahu kapan perlu isi rak.",
    text: "Stok berkurang saat penjualan tercatat. Pantau barang yang menipis dan sesuaikan persediaan saat diperlukan.",
  },
  {
    icon: ChartNoAxesColumn,
    number: "03",
    title: "Lihat hasil jualan dengan jelas.",
    text: "Periksa omzet harian, riwayat transaksi, dan barang yang paling sering dibeli dalam satu tempat.",
  },
];

function SalePreview() {
  return (
    <figure className={"landing-preview"}>
      <div className={"landing-previewTop"}>
        <span>
          <Store size={16} /> Toko Berkah
        </span>
        <span className={"landing-exampleLabel"}>Contoh tampilan</span>
      </div>
      <div className={"landing-previewBody"}>
        <div className={"landing-previewRail"} aria-hidden="true">
          <ShoppingBasket />
          <Package />
          <ReceiptText />
        </div>
        <div className={"landing-previewCatalog"}>
          <div className={"landing-previewHeading"}>
            <span>Transaksi baru</span>
            <small>Kasir · Sari</small>
          </div>
          <div className={"landing-previewSearch"}>
            Cari kebutuhan pelanggan…
          </div>
          <div className={"landing-previewCategories"}>
            <span>Semua</span>
            <span>Sembako</span>
            <span>Minuman</span>
          </div>
          <div className={"landing-previewProducts"}>
            {[
              ["Beras Premium 5 kg", 78000, "12"],
              ["Mi Instan Goreng", 3500, "24"],
              ["Minyak Goreng 1 L", 18000, "8"],
              ["Gula Pasir 1 kg", 17000, "15"],
            ].map(([name, price, stock], i) => (
              <div className={"landing-previewProduct"} key={name}>
                <div
                  className={
                    i % 2 ? "landing-yellowProduct" : "landing-greenProduct"
                  }
                >
                  <Package size={24} />
                </div>
                <strong>{name}</strong>
                <span>{rupiah(Number(price))}</span>
                <small>Stok {stock}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={"landing-previewReceipt"}>
        <div className={"landing-receiptHeading"}>
          <ReceiptText size={19} />
          <strong>Belanja hari ini</strong>
          <span>2 produk</span>
        </div>
        <div className={"landing-receiptRow"}>
          <span>
            Beras Premium 5 kg <small>× 1</small>
          </span>
          <strong>Rp78.000</strong>
        </div>
        <div className={"landing-receiptRow"}>
          <span>
            Mi Instan Goreng <small>× 2</small>
          </span>
          <strong>Rp7.000</strong>
        </div>
        <div className={"landing-receiptTotal"}>
          <span>Total pembayaran</span>
          <strong>Rp85.000</strong>
        </div>
        <div className={"landing-receiptSuccess"}>
          <Check size={14} /> Penjualan tercatat. Stok diperbarui.
        </div>
      </div>
      <figcaption>Contoh data untuk memperlihatkan alur penjualan.</figcaption>
    </figure>
  );
}

export function LandingPage() {
  return (
    <div className={"landing"}>
      <a className={"landing-skipLink"} href="#konten">
        Lewati ke konten
      </a>
      <header className={"landing-header"}>
        <Link href="/" aria-label="KOTONG — Beranda">
          <Brand />
        </Link>
        <nav aria-label="Navigasi utama" className={"landing-navigation"}>
          <a href="#fitur">Fitur</a>
          <a href="#cara-kerja">Cara kerja</a>
          <a href="#peran">Untuk tim toko</a>
        </nav>
        <Link href="/login" className={buttonVariants({ variant: "outline" })}>
          Masuk <ArrowUpRight size={16} />
        </Link>
      </header>
      <main id="konten">
        <section className={"landing-hero"} aria-labelledby="hero-title">
          <div className={"landing-heroCopy"}>
            <p className={"landing-eyebrow"}>
              <span /> DIBUAT UNTUK TOKO KELONTONG
            </p>
            <h1 id="hero-title">
              Jualan sehari-hari,
              <br />
              <span>lebih tertata.</span>
            </h1>
            <p className={"landing-heroDescription"}>
              Dari belanja pelanggan sampai stok di rak, KOTONG membantu toko
              Anda mencatat semuanya dengan rapi.
            </p>
            <div className={"landing-heroActions"}>
              <Link href="/login" className={buttonVariants({ size: "lg" })}>
                Masuk ke KOTONG <ArrowUpRight size={17} />
              </Link>
              <a href="#cara-kerja" className={"landing-textLink"}>
                Lihat cara kerjanya <ArrowDown size={16} />
              </a>
            </div>
            <div className={"landing-heroNote"}>
              <span>
                <Check size={14} /> Transaksi tunai
              </span>
              <span>
                <Check size={14} /> Persediaan tercatat
              </span>
              <span>
                <Check size={14} /> Akses sesuai peran
              </span>
            </div>
          </div>
          <SalePreview />
        </section>
        <section
          className={"landing-benefits"}
          id="fitur"
          aria-labelledby="features-title"
        >
          <div className={"landing-sectionHeader"}>
            <p className={"landing-eyebrow"}>
              SATU TEMPAT, URUSAN TOKO LEBIH RAPI
            </p>
            <h2 id="features-title">Yang penting untuk toko Anda.</h2>
            <p>
              Fokus melayani pelanggan. Catatan penjualan dan persediaan ikut
              berjalan.
            </p>
          </div>
          <div className={"landing-benefitGrid"}>
            {benefits.map(({ icon: Icon, number, title, text }) => (
              <article key={number}>
                <div className={"landing-benefitIcon"}>
                  <Icon size={24} />
                  <span>{number}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          className={"landing-workflow"}
          id="cara-kerja"
          aria-labelledby="workflow-title"
        >
          <div className={"landing-workflowIntro"}>
            <p className={"landing-eyebrow"}>DARI BELANJA SAMPAI TERCATAT</p>
            <h2 id="workflow-title">
              Alurnya sederhana.
              <br />
              Seperti belanja di toko Anda.
            </h2>
            <p>Tiga langkah untuk menyelesaikan satu penjualan.</p>
          </div>
          <ol className={"landing-steps"}>
            <li>
              <span>1</span>
              <div>
                <h3>Pilih barang pelanggan</h3>
                <p>
                  Cari nama produk, lihat stok, lalu atur jumlah barang di
                  keranjang.
                </p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <h3>Terima pembayaran</h3>
                <p>
                  Masukkan uang tunai yang diterima. KOTONG menghitung
                  kembaliannya.
                </p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <h3>Selesaikan dan cetak struk</h3>
                <p>
                  Transaksi tersimpan, stok diperbarui, dan struk siap dicetak.
                </p>
              </div>
            </li>
          </ol>
        </section>
        <section
          className={"landing-roles"}
          id="peran"
          aria-labelledby="roles-title"
        >
          <div className={"landing-sectionHeader"}>
            <p className={"landing-eyebrow"}>
              KERJA TIM, AKSES SESUAI KEBUTUHAN
            </p>
            <h2 id="roles-title">Satu toko. Dua ruang kerja.</h2>
            <p>Admin mengelola toko, kasir fokus melayani penjualan.</p>
          </div>
          <div className={"landing-roleGrid"}>
            <article className={"landing-adminRole"}>
              <span className={"landing-roleLabel"}>
                <Store size={18} /> UNTUK ADMIN
              </span>
              <h3>
                Pegang kendali
                <br />
                atas toko Anda.
              </h3>
              <ul>
                <li>
                  <Check />
                  Kelola produk, harga, dan persediaan.
                </li>
                <li>
                  <Check />
                  Pantau omzet dan produk terlaris.
                </li>
                <li>
                  <Check />
                  Atur akun serta akses kasir.
                </li>
              </ul>
            </article>
            <article className={"landing-cashierRole"}>
              <span className={"landing-roleLabel"}>
                <Users size={18} /> UNTUK KASIR
              </span>
              <h3>
                Layani pelanggan
                <br />
                dengan lebih mudah.
              </h3>
              <ul>
                <li>
                  <Check />
                  Cari produk dan cek stok tersedia.
                </li>
                <li>
                  <Check />
                  Catat penjualan tunai dan cetak struk.
                </li>
                <li>
                  <Check />
                  Lihat riwayat transaksi sendiri.
                </li>
              </ul>
              <p>Akun kasir dibuat oleh admin toko.</p>
            </article>
          </div>
        </section>
        <section className={"landing-closing"}>
          <div>
            <p className={"landing-eyebrow"}>
              SIAP MELAYANI PELANGGAN BERIKUTNYA?
            </p>
            <h2>Buka toko. Mulai dari KOTONG.</h2>
          </div>
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Masuk ke aplikasi <ArrowUpRight size={17} />
          </Link>
        </section>
      </main>
      <footer className={"landing-footer"}>
        <Link href="/" aria-label="Kembali ke beranda KOTONG">
          <Brand />
        </Link>
        <p>Teman sehari-hari toko kelontong.</p>
        <a href="#konten">Kembali ke atas ↑</a>
      </footer>
    </div>
  );
}
