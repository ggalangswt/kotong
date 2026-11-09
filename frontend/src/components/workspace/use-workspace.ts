"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { type Product, type Sale, type User, type Movement } from "@/lib/types";
import { day, change, report } from "@/lib/business";
import { api } from "@/lib/api";

export function useWorkspace({ path, user }: { path: string; user: User }) {
  const router = useRouter();
  const isCash = path === "/kasir/transaksi";
  const isSuccess = path === "/kasir/berhasil";
  const productPage = path === "/admin/produk";
  const stockPage = path === "/admin/stok";
  const accountPage = path === "/admin/kasir";
  const overview = path === "/admin";
  const reports = path === "/admin/laporan";
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cashiers, setCashiers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [now] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [lowOnly, setLowOnly] = useState(false);
  const [cashierFilter, setCashierFilter] = useState("");
  const [start, setStart] = useState(
    reports ? day(new Date(now.getTime() - 6 * 86400000)) : "",
  );
  const [end, setEnd] = useState(reports ? day(now) : "");
  const [range, setRange] = useState({
    start: reports ? day(new Date(now.getTime() - 6 * 86400000)) : "",
    end: reports ? day(now) : "",
  });
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cash, setCash] = useState("");
  const [receipt, setReceipt] = useState<{
    sale: Sale;
    cash: number;
    name: string;
  } | null>(null);
  const [dialog, setDialog] = useState<
    | "product"
    | "remove"
    | "stock"
    | "cashier"
    | "status"
    | "detail"
    | "history"
    | null
  >(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const p = await api<{ products: Product[] }>("products");
      setProducts(p.products);
      if (!isCash && !isSuccess) {
        const t = await api<{ transactions: Sale[] }>("transactions");
        setSales(t.transactions);
      }
      if (user.role === "admin") {
        const c = await api<{ cashiers: User[] }>("cashiers");
        setCashiers(c.cashiers);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [isCash, isSuccess, user.role]);
  useEffect(() => {
    void Promise.resolve().then(() => {
      void refresh();
      if (isSuccess) {
        try {
          const stored = JSON.parse(
            sessionStorage.getItem("kotong-receipt") || "null",
          );
          setReceipt(stored?.sale?.cashierId === user.id ? stored : null);
        } catch {
          setReceipt(null);
        }
      }
    });
  }, [refresh, isSuccess, user.id]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  async function mutate(action: () => Promise<unknown>, message: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
      setDialog(null);
      setToast(message);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
  function open(type: typeof dialog, p?: Product) {
    setError("");
    setSelected(p || null);
    setDialog(type);
  }
  const categories = [
    "Semua",
    ...new Set([
      "Sembako",
      "Minuman",
      "Makanan Ringan",
      "Kebutuhan Rumah",
      ...products.map((p) => p.category),
    ]),
  ];
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === "Semua" || p.category === category) &&
      (!lowOnly || p.stock <= p.minStock),
  );
  const cartRows = Object.entries(cart).map(([id, quantity]) => ({
    product: products.find((p) => p._id === id),
    quantity,
  }));
  const total = cartRows.reduce(
    (s, row) => s + (row.product?.price || 0) * row.quantity,
    0,
  );
  const changeAmount = change(total, Number(cash));
  const invalidCart = cartRows.some(
    (r) => !r.product || r.quantity > r.product.stock,
  );
  function quantity(p: Product, delta: number) {
    setCart((old) => {
      const next = { ...old };
      const n = (next[p._id] || 0) + delta;
      if (n > p.stock) {
        setError(`Stok ${p.name} hanya tersedia ${p.stock}.`);
        return old;
      }
      if (n <= 0) delete next[p._id];
      else next[p._id] = n;
      return next;
    });
  }
  async function checkout() {
    if (
      busyRef.current ||
      !Object.keys(cart).length ||
      changeAmount === null ||
      invalidCart
    )
      return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const data = await api<{ transaction: Sale }>("transactions", "POST", {
        paymentMethod: "cash",
        items: Object.entries(cart).map(([productId, quantity]) => ({
          productId,
          quantity,
        })),
      });
      const value = {
        sale: data.transaction,
        cash: Number(cash),
        name: user.name,
      };
      setCart({});
      try {
        sessionStorage.setItem("kotong-receipt", JSON.stringify(value));
      } catch {
        setReceipt(value);
        setToast(
          "Transaksi tersimpan. Penyimpanan struk lokal tidak tersedia.",
        );
        return;
      }
      router.push("/kasir/berhasil");
    } catch (e) {
      setError(
        `${(e as Error).message} Jika koneksi terputus, periksa Riwayat Saya sebelum mengulangi pembayaran.`,
      );
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
  async function history(p: Product) {
    open("history", p);
    setMovements([]);
    setHistoryLoading(true);
    try {
      const data = await api<{ movements: Movement[] }>(
        `products/${p._id}/stock-movements`,
      );
      setMovements(data.movements);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setHistoryLoading(false);
    }
  }
  // shortcut: reports aggregate accessible transactions locally; move to a paginated reporting API when volume grows.
  const selectedReport = report(
    sales,
    range.start || "0000",
    range.end || "9999",
  );
  const todayReport = report(sales, day(now), day(now));
  const weekReport = report(
    sales,
    day(new Date(now.getTime() - 6 * 86400000)),
    day(now),
  );
  const low = products.filter((p) => p.stock <= p.minStock);
  const title = isCash
    ? "Transaksi Baru"
    : isSuccess
      ? "Transaksi Berhasil"
      : productPage
        ? "Produk"
        : stockPage
          ? "Stok"
          : accountPage
            ? "Akun Kasir"
            : overview
              ? "Ringkasan Toko"
              : reports
                ? "Laporan Penjualan"
                : "Riwayat Transaksi";
  const subtitle = isCash
    ? "Pilih kebutuhan pelanggan, lalu selesaikan pembayaran."
    : isSuccess
      ? "Terima kasih. Penjualan sudah tercatat."
      : overview
        ? `Selamat datang, ${user.name.split(" ")[0]}. Ini kabar toko hari ini.`
        : productPage
          ? "Kelola barang yang tersedia di rak toko."
          : stockPage
            ? "Persediaan terpantau, jualan tetap lancar."
            : accountPage
              ? "Kelola akses tim yang membantu toko Anda."
              : reports
                ? "Lihat hasil penjualan pada periode yang Anda pilih."
                : user.role === "cashier"
                  ? "Semua penjualan yang Anda layani, tercatat di sini."
                  : "Telusuri penjualan dari seluruh kasir toko.";
  function detail(s: Sale) {
    setSelectedSale(s);
    setDialog("detail");
  }
  return {
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
    invalidCart,
    checkout,
    receipt,
    router,
    productPage,
    open,
    history,
    stockPage,
    lowOnly,
    setLowOnly,
    todayReport,
    now,
    low,
    weekReport,
    sales,
    cashiers,
    detail,
    start,
    end,
    setStart,
    setEnd,
    setRange,
    selectedReport,
    range,
    user,
    cashierFilter,
    setCashierFilter,
    setSelectedUser,
    setDialog,
    dialog,
    selected,
    selectedUser,
    error,
    mutate,
    setError,
    historyLoading,
    movements,
    selectedSale,
    title,
    subtitle,
    accountPage,
    toast,
    setToast,
    loading,
    products,
    refresh,
    isCash,
    isSuccess,
    overview,
    reports,
  };
}
export type WorkspaceState = ReturnType<typeof useWorkspace>;
