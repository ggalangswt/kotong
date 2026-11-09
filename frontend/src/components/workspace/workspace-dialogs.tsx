"use client";
import {
  CashierForm,
  CashierStatus,
} from "@/components/cashiers/cashier-actions";
import {
  StockAdjustment,
  StockHistory,
} from "@/components/stock/stock-actions";
import {
  ProductForm,
  ProductRemoval,
} from "@/components/products/product-actions";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { SaleDetail } from "@/components/transactions/sale-detail";

import { type WorkspaceState } from "@/components/workspace/use-workspace";

type Props = Pick<
  WorkspaceState,
  | "dialog"
  | "busy"
  | "setDialog"
  | "selected"
  | "selectedUser"
  | "error"
  | "mutate"
  | "categories"
  | "setError"
  | "historyLoading"
  | "movements"
  | "selectedSale"
  | "user"
  | "cashiers"
>;
export function WorkspaceDialogs({
  dialog,
  busy,
  setDialog,
  selected,
  selectedUser,
  error,
  mutate,
  categories,
  setError,
  historyLoading,
  movements,
  selectedSale,
  user,
  cashiers,
}: Props) {
  return (
    <Dialog
      open={dialog !== null}
      onOpenChange={(v) => {
        if (!v && !busy) setDialog(null);
      }}
    >
      <DialogContent
        className={
          dialog === "history" || dialog === "detail"
            ? "kotong-dialog large"
            : "kotong-dialog"
        }
      >
        <DialogHeader>
          <DialogTitle>
            {dialog === "product"
              ? selected
                ? "Edit Produk"
                : "Tambah Produk"
              : dialog === "stock"
                ? "Sesuaikan Stok"
                : dialog === "remove"
                  ? "Hapus produk dari katalog?"
                  : dialog === "cashier"
                    ? "Tambah Akun Kasir"
                    : dialog === "status"
                      ? selectedUser?.status === "active"
                        ? "Nonaktifkan akun kasir?"
                        : "Aktifkan akun kasir?"
                      : dialog === "history"
                        ? "Riwayat Pergerakan Stok"
                        : "Detail Transaksi"}
          </DialogTitle>
          <DialogDescription>
            {dialog === "product"
              ? "Pastikan informasi produk sesuai dengan barang di toko."
              : dialog === "stock"
                ? selected?.name
                : dialog === "history"
                  ? selected?.name
                  : dialog === "detail"
                    ? "Harga di bawah adalah harga yang tercatat saat penjualan."
                    : dialog === "cashier"
                      ? "Berikan akses penjualan untuk anggota tim Anda."
                      : "Periksa kembali sebelum melanjutkan."}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {dialog === "product" && (
          <ProductForm
            mutate={mutate}
            selected={selected}
            categories={categories}
            busy={busy}
            setDialog={setDialog}
          />
        )}
        {dialog === "stock" && selected && (
          <StockAdjustment
            selected={selected}
            setError={setError}
            mutate={mutate}
            busy={busy}
            setDialog={setDialog}
          />
        )}
        {dialog === "remove" && selected && (
          <ProductRemoval
            selected={selected}
            busy={busy}
            setDialog={setDialog}
            mutate={mutate}
          />
        )}
        {dialog === "cashier" && (
          <CashierForm mutate={mutate} busy={busy} setDialog={setDialog} />
        )}
        {dialog === "status" && selectedUser && (
          <CashierStatus
            selectedUser={selectedUser}
            busy={busy}
            setDialog={setDialog}
            mutate={mutate}
          />
        )}
        {dialog === "history" && (
          <StockHistory
            historyLoading={historyLoading}
            setDialog={setDialog}
            movements={movements}
          />
        )}
        {dialog === "detail" && selectedSale && (
          <SaleDetail
            sale={selectedSale}
            cashier={
              selectedSale.cashierId === user.id
                ? user.name
                : cashiers.find((c) => c.id === selectedSale.cashierId)?.name ||
                  "Kasir"
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
