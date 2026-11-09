"use client";
import type { WorkspaceState } from "@/components/workspace/use-workspace";
import { Button } from "@/components/ui/button";
import { Field, FormActions } from "@/components/shared/fields";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";
import { DataTable } from "@/components/shared/data-table";
import { dateTime } from "@/lib/business";
type StockAdjustmentProps = Omit<
  Pick<
    WorkspaceState,
    "selected" | "setError" | "mutate" | "busy" | "setDialog"
  >,
  "selected"
> & { selected: Product };
export function StockAdjustment({
  selected,
  setError,
  mutate,
  busy,
  setDialog,
}: StockAdjustmentProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const stock = Number(f.get("stock"));
        if (stock === selected.stock) {
          setError("Stok baru masih sama. Tidak ada penyesuaian.");
          return;
        }
        void mutate(
          () =>
            api(`products/${selected._id}/stock-adjustments`, "POST", {
              quantity: stock - selected.stock,
            }),
          "Stok berhasil disesuaikan.",
        );
      }}
    >
      <div className="stock-current">
        <span>Stok saat ini</span>
        <strong>{selected.stock} unit</strong>
      </div>
      <Field label="Jumlah stok baru">
        <input
          name="stock"
          type="number"
          min={0}
          max={Number.MAX_SAFE_INTEGER}
          step={1}
          defaultValue={selected.stock}
          required
        />
      </Field>
      <p className="hint">
        Masukkan jumlah fisik terakhir. Perubahan dihitung dari stok saat ini;
        hindari penyesuaian bersamaan dengan kasir lain.
      </p>
      <FormActions busy={busy} cancel={() => setDialog(null)} />
    </form>
  );
}
type StockHistoryProps = Pick<
  WorkspaceState,
  "historyLoading" | "setDialog" | "movements"
>;
export function StockHistory({
  historyLoading,
  setDialog,
  movements,
}: StockHistoryProps) {
  return historyLoading ? (
    <p>Memuat riwayat…</p>
  ) : (
    <>
      <div className="history-toolbar">
        <span>Perubahan terbaru ditampilkan dahulu.</span>
        <Button variant="outline" onClick={() => setDialog("stock")}>
          Sesuaikan Stok
        </Button>
      </div>
      <DataTable
        headings={["Waktu", "Sebelum", "Perubahan", "Sesudah", "Jenis"]}
        rows={movements.map((m) => [
          dateTime(m.createdAt),
          m.stockBefore,
          `${m.quantity > 0 ? "+" : ""}${m.quantity}`,
          m.stockAfter,
          m.type === "sale" ? "Penjualan" : "Penyesuaian",
        ])}
      />
    </>
  );
}
