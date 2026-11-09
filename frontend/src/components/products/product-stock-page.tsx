"use client";
import { Package, Search, Trash2, Pencil, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/business";
import { Badge } from "@/components/shared/feedback";
import { DataTable } from "@/components/shared/data-table";
import { type WorkspaceState } from "@/components/workspace/use-workspace";

type Props = Pick<
  WorkspaceState,
  | "productPage"
  | "filtered"
  | "open"
  | "history"
  | "search"
  | "setSearch"
  | "category"
  | "setCategory"
  | "categories"
  | "stockPage"
  | "lowOnly"
  | "setLowOnly"
>;
export function ProductStockPage({
  productPage,
  filtered,
  open,
  history,
  search,
  setSearch,
  category,
  setCategory,
  categories,
  stockPage,
  lowOnly,
  setLowOnly,
}: Props) {
  const filters = (
    <div className="filters">
      <div className="search">
        <Search size={17} />
        <input
          aria-label="Cari produk"
          placeholder="Cari nama produk…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <select
        aria-label="Kategori produk"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {categories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      {stockPage && (
        <label className="check">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => setLowOnly(e.target.checked)}
          />
          Stok menipis saja
        </label>
      )}
    </div>
  );
  return (
    <section className="panel">
      {filters}
      <DataTable
        headings={
          productPage
            ? [
                "Nama produk",
                "Kategori",
                "Harga",
                "Stok",
                "Batas minimum",
                "Status stok",
                "Aksi",
              ]
            : [
                "Nama produk",
                "Kategori",
                "Stok saat ini",
                "Batas minimum",
                "Status stok",
                "Aksi",
              ]
        }
        rows={filtered.map((p) => [
          <div className="product-name" key="name">
            <span className="table-icon">
              <Package size={17} />
            </span>
            <strong>{p.name}</strong>
          </div>,
          p.category,
          ...(productPage ? [rupiah(p.price)] : []),
          `${p.stock} unit`,
          `${p.minStock} unit`,
          <Badge key="badge" low={p.stock <= p.minStock}>
            {p.stock === 0
              ? "Habis"
              : p.stock <= p.minStock
                ? "Menipis"
                : "Aman"}
          </Badge>,
          <div className="row-actions" key="actions">
            {productPage ? (
              <>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Edit ${p.name}`}
                  onClick={() => open("product", p)}
                >
                  <Pencil size={15} />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Hapus ${p.name}`}
                  onClick={() => open("remove", p)}
                >
                  <Trash2 size={15} />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => open("stock", p)}
                >
                  Sesuaikan
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Riwayat ${p.name}`}
                  onClick={() => history(p)}
                >
                  <History size={17} />
                </Button>
              </>
            )}
          </div>,
        ])}
      />
    </section>
  );
}
