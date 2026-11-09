"use client";
import { Search, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rupiah, dateTime } from "@/lib/business";
import { DateRange } from "@/components/shared/fields";
import { DataTable } from "@/components/shared/data-table";
import { type WorkspaceState } from "@/components/workspace/use-workspace";

type Props = Pick<
  WorkspaceState,
  | "search"
  | "setSearch"
  | "start"
  | "end"
  | "setStart"
  | "setRange"
  | "setEnd"
  | "user"
  | "cashierFilter"
  | "setCashierFilter"
  | "cashiers"
  | "selectedReport"
  | "detail"
>;
export function TransactionsPage({
  search,
  setSearch,
  start,
  end,
  setStart,
  setRange,
  setEnd,
  user,
  cashierFilter,
  setCashierFilter,
  cashiers,
  selectedReport,
  detail,
}: Props) {
  const transactionRows = selectedReport.sales
    .filter(
      (s) =>
        (!cashierFilter || s.cashierId === cashierFilter) &&
        (!search || s.id.toLowerCase().includes(search.toLowerCase())),
    )
    .map((s) => [
      <span className="mono" key="id">
        #{s.id.slice(-8).toUpperCase()}
      </span>,
      dateTime(s.date),
      ...(user.role === "admin"
        ? [cashiers.find((c) => c.id === s.cashierId)?.name || "Kasir"]
        : []),
      <strong key="total">{rupiah(s.totalAmount)}</strong>,
      <Button size="sm" variant="ghost" key="detail" onClick={() => detail(s)}>
        Detail
        <ArrowUpRight size={15} />
      </Button>,
    ]);
  return (
    <section className="panel">
      <div className="filters">
        <div className="search">
          <Search size={17} />
          <input
            placeholder="Cari ID transaksi…"
            aria-label="Cari transaksi"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <DateRange
          start={start}
          end={end}
          setStart={(v) => {
            setStart(v);
            setRange((r) => ({ ...r, start: v }));
          }}
          setEnd={(v) => {
            setEnd(v);
            setRange((r) => ({ ...r, end: v }));
          }}
        />
        {user.role === "admin" && (
          <select
            aria-label="Filter kasir"
            value={cashierFilter}
            onChange={(e) => setCashierFilter(e.target.value)}
          >
            <option value="">Semua kasir</option>
            {cashiers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {start && end && start > end ? (
        <p className="error">Tanggal akhir harus sesudah tanggal mulai.</p>
      ) : (
        <DataTable
          headings={[
            "ID transaksi",
            "Tanggal & waktu",
            ...(user.role === "admin" ? ["Kasir"] : []),
            "Total",
            "Aksi",
          ]}
          rows={transactionRows}
        />
      )}
    </section>
  );
}
