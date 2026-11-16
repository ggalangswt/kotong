"use client";
import { Button as HeroButton } from "@heroui/react";
import {
  ShoppingBasket,
  Wheat,
  Package,
  CupSoda,
  House,
  Soup,
  Search,
  Plus,
  Minus,
  Trash2,
  ArrowUpRight,
  Banknote,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cashSuggestions, rupiah, shortRupiah } from "@/lib/business";
import { Empty } from "@/components/shared/feedback";
import { Field } from "@/components/shared/fields";
import { type WorkspaceState } from "@/components/workspace/use-workspace";
import { QrisDialog } from "@/components/cashier/qris-dialog";
import { type PaymentMethod } from "@/lib/types";

const PAYMENT_OPTIONS: {
  value: PaymentMethod;
  label: string;
  icon: typeof Banknote;
}[] = [
  { value: "cash", label: "Tunai", icon: Banknote },
  { value: "qris", label: "QRIS", icon: QrCode },
];

type Props = Pick<
  WorkspaceState,
  | "search"
  | "setSearch"
  | "categories"
  | "category"
  | "setCategory"
  | "filtered"
  | "quantity"
  | "cart"
  | "cartRows"
  | "setCart"
  | "total"
  | "cash"
  | "setCash"
  | "changeAmount"
  | "busy"
  | "checkout"
  | "canCheckout"
  | "paymentMethod"
  | "setPaymentMethod"
  | "pendingSale"
  | "cancel"
  | "simulate"
  | "qrisBusy"
  | "qrisError"
>;

function categoryKey(category: string) {
  const normalized = category
    .trim()
    .toLocaleLowerCase("id-ID")
    .replace(/\s+/g, "-");

  switch (normalized) {
    case "sembako":
    case "minuman":
    case "kebutuhan-rumah":
    case "mie-instan":
      return normalized;
    default:
      return "other";
  }
}

function CategoryIcon({ category }: { category: string }) {
  switch (categoryKey(category)) {
    case "sembako":
      return <Wheat size={28} />;
    case "minuman":
      return <CupSoda size={28} />;
    case "kebutuhan-rumah":
      return <House size={28} />;
    case "mie-instan":
      return <Soup size={28} />;
    default:
      return <Package size={28} />;
  }
}

export function CashierSale({
  search,
  setSearch,
  categories,
  category,
  setCategory,
  filtered,
  quantity,
  cart,
  cartRows,
  setCart,
  total,
  cash,
  setCash,
  changeAmount,
  busy,
  checkout,
  canCheckout,
  paymentMethod,
  setPaymentMethod,
  ...qris
}: Props) {
  const isQris = paymentMethod === "qris";
  return (
    <div className="pos-layout">
      <section>
        <div className="search catalog-search">
          <Search size={19} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari barang yang dibutuhkan pelanggan…"
            aria-label="Cari produk"
          />
          <span>Nama produk</span>
        </div>
        <div className="category-tabs">
          {categories.map((c) => (
            <HeroButton
              key={c}
              variant="ghost"
              className={category === c ? "category active" : "category"}
              onPress={() => setCategory(c)}
            >
              {c}
            </HeroButton>
          ))}
        </div>
        <div className="section-line">
          <h2>Katalog produk</h2>
          <span>{filtered.length} produk tersedia</span>
        </div>
        <div className="product-grid">
          {filtered.map((p) => (
            <button
              key={p._id}
              className={`product-card category-${categoryKey(p.category)}`}
              disabled={!p.stock}
              onClick={() => quantity(p, 1)}
            >
              <div className="product-symbol">
                <CategoryIcon category={p.category} />
                <span>{p.category}</span>
              </div>
              <h3>{p.name}</h3>
              <strong>{rupiah(p.price)}</strong>
              <div className="product-footer">
                <span className={p.stock <= p.minStock ? "low-text" : ""}>
                  {p.stock ? `Stok ${p.stock}` : "Stok habis"}
                </span>
                <span className="add-icon">
                  <Plus size={18} />
                </span>
              </div>
            </button>
          ))}
        </div>
        {!filtered.length && (
          <Empty title="Produk tidak ditemukan">
            Coba kata kunci atau kategori lain.
          </Empty>
        )}
      </section>
      <aside className="cart panel">
        <div className="cart-heading">
          <div>
            <h2>Keranjang</h2>
            <p>
              {Object.values(cart).reduce((a, b) => a + b, 0)} barang dipilih
            </p>
          </div>
          <ShoppingBasket size={24} />
        </div>
        <div className="cart-items">
          {cartRows.map(({ product: p, quantity: q }, i) =>
            p ? (
              <div className="cart-item" key={p._id}>
                <div className="cart-item-title">
                  <strong>{p.name}</strong>
                  <button
                    aria-label={`Hapus ${p.name}`}
                    onClick={() =>
                      setCart((old) => {
                        const n = { ...old };
                        delete n[p._id];
                        return n;
                      })
                    }
                  >
                    <Trash2 className="cart-remove-icon" size={15} />
                  </button>
                </div>
                <p>{rupiah(p.price)} / barang</p>
                <div className="cart-item-bottom">
                  <div className="quantity">
                    <HeroButton
                      isIconOnly
                      variant="ghost"
                      aria-label={`Kurangi ${p.name}`}
                      onPress={() => quantity(p, -1)}
                    >
                      <Minus size={13} />
                    </HeroButton>
                    <span>{q}</span>
                    <HeroButton
                      isIconOnly
                      variant="ghost"
                      aria-label={`Tambah ${p.name}`}
                      isDisabled={q >= p.stock}
                      onPress={() => quantity(p, 1)}
                    >
                      <Plus size={13} />
                    </HeroButton>
                  </div>
                  <strong>{rupiah(p.price * q)}</strong>
                </div>
              </div>
            ) : (
              <p key={i} className="error">
                Produk tidak tersedia lagi.
              </p>
            ),
          )}
          {!cartRows.length && (
            <Empty title="Keranjang masih kosong">
              Pilih produk untuk memulai penjualan.
            </Empty>
          )}
        </div>
        <div className="cart-payment">
          <div className="total-line">
            <span>Total pembayaran</span>
            <strong>{rupiah(total)}</strong>
          </div>
          <div
            className="payment-methods"
            role="radiogroup"
            aria-label="Metode pembayaran"
          >
            {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={paymentMethod === value}
                className={
                  paymentMethod === value
                    ? "payment-method active"
                    : "payment-method"
                }
                onClick={() => setPaymentMethod(value)}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          {isQris ? (
            <p className="qris-hint">
              Kode QRIS akan muncul setelah transaksi dibuat. Stok ditahan
              sampai pembayaran berhasil.
            </p>
          ) : (
            <>
              <Field label="Uang diterima">
                <div className="money-input">
                  <span>Rp</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={100}
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                    placeholder="0"
                    aria-label="Uang diterima"
                  />
                </div>
              </Field>
              {total > 0 && (
                <div className="quick-cash" aria-label="Pilihan uang cepat">
                  {[total, ...cashSuggestions(total)].map((amount, i) => (
                    <button
                      key={amount}
                      type="button"
                      className={
                        Number(cash) === amount
                          ? "quick-cash-option active"
                          : "quick-cash-option"
                      }
                      aria-pressed={Number(cash) === amount}
                      onClick={() => setCash(String(amount))}
                    >
                      {i === 0 ? "Uang pas" : shortRupiah(amount)}
                    </button>
                  ))}
                </div>
              )}
              <div className="change-line">
                <span>Kembalian</span>
                <strong>
                  {cash && changeAmount === null
                    ? "Uang belum cukup"
                    : rupiah(changeAmount || 0)}
                </strong>
              </div>
            </>
          )}
          <Button
            className="w-full"
            disabled={busy || !canCheckout}
            onClick={checkout}
          >
            {busy
              ? isQris
                ? "Membuat kode QRIS…"
                : "Menyimpan transaksi…"
              : isQris
                ? "Bayar dengan QRIS"
                : "Selesaikan Transaksi"}
            <ArrowUpRight size={17} />
          </Button>
          <small className="cash-note">
            {isQris ? "Pembayaran QRIS via Xendit" : "Pembayaran tunai"} · Harga
            diperiksa saat disimpan
          </small>
        </div>
      </aside>
      <QrisDialog {...qris} />
    </div>
  );
}
