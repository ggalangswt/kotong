"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rupiah, day, dateTime } from "@/lib/business";
import { Badge, Empty } from "@/components/shared/feedback";
import { DataTable } from "@/components/shared/data-table";
import { type WorkspaceState } from "@/components/workspace/use-workspace";

type Props = Pick<
  WorkspaceState,
  "todayReport" | "now" | "low" | "weekReport" | "sales" | "cashiers" | "detail"
>;
export function OverviewPage({
  todayReport,
  now,
  low,
  weekReport,
  sales,
  cashiers,
  detail,
}: Props) {
  return (
    <>
      <div className="summary-strip">
        <div className="summary lavender">
          <span>Omzet hari ini</span>
          <strong>{rupiah(todayReport.revenue)}</strong>
          <small>Penjualan tunai yang tercatat</small>
        </div>
        <div className="summary blue">
          <span>Transaksi hari ini</span>
          <strong>
            {todayReport.sales.length}
            <em>transaksi</em>
          </strong>
          <small>{day(now)} · WIB</small>
        </div>
        <div className="summary cream">
          <span>Stok perlu perhatian</span>
          <strong>
            {low.length}
            <em>produk</em>
          </strong>
          <Link href="/admin/stok">
            Periksa persediaan <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
      <div className="overview-grid">
        <section className="panel">
          <div className="section-line">
            <div>
              <h2>Persediaan menipis</h2>
              <p>Siapkan stok sebelum rak kosong.</p>
            </div>
            <Link href="/admin/stok">
              Lihat stok <ArrowUpRight size={15} />
            </Link>
          </div>
          <DataTable
            headings={["Produk", "Stok", "Minimum", "Status"]}
            rows={low.slice(0, 5).map((p) => [
              p.name,
              `${p.stock} unit`,
              `${p.minStock} unit`,
              <Badge key="s" low>
                Menipis
              </Badge>,
            ])}
          />
        </section>
        <section className="panel">
          <div className="section-line">
            <div>
              <h2>Paling sering dibeli</h2>
              <p>7 hari terakhir · sampai hari ini</p>
            </div>
          </div>
          {weekReport.products.slice(0, 5).map((p, i) => (
            <div key={p.name + i} className="rank-row">
              <span className="rank">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <strong>{p.name}</strong>
                <small>{rupiah(p.revenue)}</small>
              </div>
              <Badge>{p.quantity} terjual</Badge>
            </div>
          ))}
          {!weekReport.products.length && <Empty />}
        </section>
        <section className="panel recent">
          <div className="section-line">
            <h2>Transaksi terbaru</h2>
            <Link href="/admin/transaksi">
              Semua transaksi <ArrowUpRight size={15} />
            </Link>
          </div>
          <DataTable
            headings={["Transaksi", "Waktu", "Kasir", "Total", ""]}
            rows={sales.slice(0, 4).map((s) => [
              `#${s.id.slice(-8).toUpperCase()}`,
              dateTime(s.date),
              cashiers.find((c) => c.id === s.cashierId)?.name || "Kasir",
              rupiah(s.totalAmount),
              <Button key="d" variant="ghost" onClick={() => detail(s)}>
                Detail
                <ArrowUpRight size={14} />
              </Button>,
            ])}
          />
        </section>
      </div>
    </>
  );
}
