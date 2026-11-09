"use client";
import type { WorkspaceState } from "@/components/workspace/use-workspace";
import { Button } from "@/components/ui/button";
import { Field, FormActions } from "@/components/shared/fields";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";
type ProductFormProps = Pick<
  WorkspaceState,
  "mutate" | "selected" | "categories" | "busy" | "setDialog"
>;
export function ProductForm({
  mutate,
  selected,
  categories,
  busy,
  setDialog,
}: ProductFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void mutate(
          () =>
            api(
              selected ? `products/${selected._id}` : "products",
              selected ? "PATCH" : "POST",
              {
                name: f.get("name"),
                category: f.get("category"),
                price: Number(f.get("price")),
                minStock: Number(f.get("minStock")),
              },
            ),
          "Produk berhasil disimpan.",
        );
      }}
    >
      <Field label="Nama produk">
        <input
          name="name"
          required
          defaultValue={selected?.name}
          placeholder="Contoh: Beras Premium 5 kg"
        />
      </Field>
      <Field label="Kategori">
        <input
          list="categories"
          name="category"
          required
          defaultValue={selected?.category}
          placeholder="Pilih atau tulis kategori"
        />
        <datalist id="categories">
          {categories
            .filter((c) => c !== "Semua")
            .map((c) => (
              <option key={c} value={c} />
            ))}
        </datalist>
      </Field>
      <div className="form-grid">
        <Field label="Harga (Rp)">
          <input
            name="price"
            type="number"
            required
            min={0}
            max={Number.MAX_SAFE_INTEGER}
            step={1}
            defaultValue={selected?.price}
          />
        </Field>
        <Field label="Batas minimum stok">
          <input
            name="minStock"
            type="number"
            required
            min={0}
            step={1}
            max={Number.MAX_SAFE_INTEGER}
            defaultValue={selected?.minStock ?? 5}
          />
        </Field>
      </div>
      {!selected && (
        <p className="hint">
          Stok awal 0. Tambahkan persediaan melalui halaman Stok.
        </p>
      )}
      <FormActions busy={busy} cancel={() => setDialog(null)} />
    </form>
  );
}
type ProductRemovalProps = Omit<
  Pick<WorkspaceState, "selected" | "busy" | "setDialog" | "mutate">,
  "selected"
> & { selected: Product };
export function ProductRemoval({
  selected,
  busy,
  setDialog,
  mutate,
}: ProductRemovalProps) {
  return (
    <>
      <p>
        <strong>{selected.name}</strong> akan dihapus dari katalog. Penjualan
        sebelumnya tetap tersimpan dalam riwayat transaksi.
      </p>
      <div className="dialog-actions">
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => setDialog(null)}
        >
          Batal
        </Button>
        <Button
          variant="destructive"
          disabled={busy}
          onClick={() =>
            mutate(
              () => api(`products/${selected._id}`, "DELETE"),
              "Produk dihapus dari katalog.",
            )
          }
        >
          {busy ? "Menghapus…" : "Hapus Produk"}
        </Button>
      </div>
    </>
  );
}
