"use client";
import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function FormActions({
  busy,
  cancel,
}: {
  busy: boolean;
  cancel: () => void;
}) {
  return (
    <div className="dialog-actions">
      <Button type="button" variant="outline" disabled={busy} onClick={cancel}>
        Batal
      </Button>
      <Button type="submit" className="primary" disabled={busy}>
        {busy ? "Menyimpan…" : "Simpan"}
      </Button>
    </div>
  );
}
export function DateRange({
  start,
  end,
  setStart,
  setEnd,
}: {
  start: string;
  end: string;
  setStart: (v: string) => void;
  setEnd: (v: string) => void;
}) {
  return (
    <div className="date-range">
      <input
        type="date"
        aria-label="Tanggal mulai"
        value={start}
        onChange={(e) => setStart(e.target.value)}
      />
      <span>—</span>
      <input
        type="date"
        aria-label="Tanggal akhir"
        min={start || undefined}
        value={end}
        onChange={(e) => setEnd(e.target.value)}
      />
    </div>
  );
}
