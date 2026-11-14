"use client";
import Link from "next/link";
import { Plus, Check, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/business";
import { Brand } from "@/components/shared/brand";
import { Empty } from "@/components/shared/feedback";
import { SaleDetail } from "@/components/transactions/sale-detail";
import { type WorkspaceState } from "@/components/workspace/use-workspace";
import { useStore } from "@/components/session/store-context";

type Props = Pick<WorkspaceState, "receipt" | "router">;
export function ReceiptView({ receipt, router }: Props) {
  const { store } = useStore();
  return (
    <section className="success-layout">
      {receipt ? (
        <>
          <div className="success-intro">
            <span className="success-icon">
              <Check size={30} />
            </span>
            <h2>Penjualan berhasil!</h2>
            <p>Stok sudah diperbarui. Struk siap dicetak.</p>
          </div>
          <div className="receipt panel">
            <Brand />
            <p>
              {store.name}
              <br />
              Struk pembayaran tunai
            </p>
            <SaleDetail sale={receipt.sale} cashier={receipt.name} />
            <div className="receipt-money">
              <span>Uang diterima</span>
              <strong>{rupiah(receipt.cash)}</strong>
              <span>
                {receipt.cash >= receipt.sale.totalAmount
                  ? "Kembalian"
                  : "Kekurangan pembayaran"}
              </span>
              <strong>
                {rupiah(Math.abs(receipt.cash - receipt.sale.totalAmount))}
              </strong>
            </div>
            <p className="receipt-thanks">
              Terima kasih sudah berbelanja.
              <br />
              Sampai bertemu kembali!
            </p>
          </div>
          <div className="success-actions">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={17} />
              Cetak Struk
            </Button>
            <Button onClick={() => router.push("/kasir/transaksi")}>
              <Plus size={17} />
              Transaksi Baru
            </Button>
          </div>
        </>
      ) : (
        <div className="panel">
          <Empty title="Struk sesi ini tidak tersedia">
            Lihat detail transaksi di Riwayat Saya.
          </Empty>
          <Link href="/kasir/riwayat">Buka Riwayat Saya</Link>
        </div>
      )}
    </section>
  );
}
