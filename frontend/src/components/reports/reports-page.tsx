"use client";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/business";
import { Badge } from "@/components/shared/feedback";
import { DateRange } from "@/components/shared/fields";
import { DataTable } from "@/components/shared/data-table";
import { type WorkspaceState } from "@/components/workspace/use-workspace";

type Props = Pick<
  WorkspaceState,
  | "start"
  | "end"
  | "setStart"
  | "setEnd"
  | "setRange"
  | "selectedReport"
  | "range"
>;
export function ReportsPage({
  start,
  end,
  setStart,
  setEnd,
  setRange,
  selectedReport,
  range,
}: Props) {
  return (
    <>
      <section className="panel report-filter">
        <div>
          <h2>Periode laporan</h2>
          <p>Tanggal dihitung dalam Waktu Indonesia Barat.</p>
        </div>
        <DateRange
          start={start}
          end={end}
          setStart={setStart}
          setEnd={setEnd}
        />
        <Button
          disabled={!start || !end || start > end}
          onClick={() => setRange({ start, end })}
        >
          Terapkan
        </Button>
      </section>
      <div className="report-summary">
        <div>
          <span>Omzet pada periode ini</span>
          <h2>{rupiah(selectedReport.revenue)}</h2>
        </div>
        <span>
          {selectedReport.sales.length} transaksi · {range.start} — {range.end}
        </span>
      </div>
      <div className="report-grid">
        <section className="panel">
          <div className="section-line">
            <h2>Penjualan harian</h2>
            <Badge>WIB</Badge>
          </div>
          <DataTable
            headings={["Tanggal", "Transaksi", "Omzet"]}
            rows={selectedReport.daily.map((r) => [
              r.date,
              r.count,
              <strong key="v">{rupiah(r.revenue)}</strong>,
            ])}
          />
        </section>
        <section className="panel">
          <div className="section-line">
            <h2>Produk terlaris</h2>
            <span>Periode terpilih</span>
          </div>
          <DataTable
            headings={["Produk", "Terjual", "Penjualan"]}
            rows={selectedReport.products.map((p) => [
              p.name,
              `${p.quantity} unit`,
              rupiah(p.revenue),
            ])}
          />
        </section>
      </div>
    </>
  );
}
