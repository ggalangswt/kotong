"use client";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/shared/feedback";

export function DataTable({
  headings,
  rows,
}: {
  headings: string[];
  rows: ReactNode[][];
}) {
  const [page, setPage] = useState(0);
  const current = Math.min(page, Math.max(0, Math.ceil(rows.length / 8) - 1));
  return (
    <>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {headings.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(current * 8, current * 8 + 8).map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <Empty title="Tidak ada hasil" />}
      {rows.length > 8 && (
        <div className="pagination">
          <span>
            {current * 8 + 1}–{Math.min((current + 1) * 8, rows.length)} dari{" "}
            {rows.length}
          </span>
          <Button
            variant="outline"
            disabled={!current}
            onClick={() => setPage(current - 1)}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            disabled={(current + 1) * 8 >= rows.length}
            onClick={() => setPage(current + 1)}
          >
            Berikutnya
          </Button>
        </div>
      )}
    </>
  );
}
