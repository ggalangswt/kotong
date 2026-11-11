"use client";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SegmentError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="connection" role="alert">
      <AlertCircle />
      <h1>Terjadi kesalahan</h1>
      <p>Halaman ini gagal dimuat. Silakan coba lagi.</p>
      <Button onClick={reset}>Coba lagi</Button>
    </div>
  );
}
