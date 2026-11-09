"use client";
import { type Sale } from "@/lib/types";
import { rupiah, dateTime } from "@/lib/business";
import { DataTable } from "@/components/shared/data-table";

export function SaleDetail({ sale, cashier }: { sale: Sale; cashier: string }) {
  return (
    <div className="sale-detail">
      <dl>
        <div>
          <dt>ID transaksi</dt>
          <dd className="mono">{sale.id}</dd>
        </div>
        <div>
          <dt>Tanggal & waktu</dt>
          <dd>{dateTime(sale.date)} WIB</dd>
        </div>
        <div>
          <dt>Kasir</dt>
          <dd>{cashier}</dd>
        </div>
        <div>
          <dt>Pembayaran</dt>
          <dd>Tunai</dd>
        </div>
      </dl>
      <DataTable
        headings={["Produk", "Jumlah", "Harga", "Subtotal"]}
        rows={sale.items.map((i) => [
          i.productName,
          i.quantity,
          rupiah(i.priceAtTransaction),
          rupiah(i.subtotal),
        ])}
      />
      <div className="total-line">
        <span>Total pembayaran</span>
        <strong>{rupiah(sale.totalAmount)}</strong>
      </div>
    </div>
  );
}
