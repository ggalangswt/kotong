"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Sale } from "@/lib/types";

const POLL_INTERVAL_MS = 3000;

const CLOSED_MESSAGES: Record<string, string> = {
  expired: "Kode QRIS kedaluwarsa. Stok sudah dikembalikan, silakan ulangi.",
  cancelled: "Pembayaran QRIS dibatalkan. Stok sudah dikembalikan.",
  failed: "Pembayaran QRIS gagal. Stok sudah dikembalikan.",
};

interface Options {
  onPaid: (sale: Sale) => void;
  onClosed: (message: string) => void | Promise<void>;
}

// Tracks one pending QRIS sale: polls the backend until it is paid, expired, or cancelled.
export function useQrisPayment({ onPaid, onClosed }: Options) {
  const [pendingSale, setPendingSale] = useState<Sale | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const handlers = useRef({ onPaid, onClosed });
  useEffect(() => {
    handlers.current = { onPaid, onClosed };
  }, [onPaid, onClosed]);

  const settle = useCallback((sale: Sale) => {
    if (sale.status === "pending") {
      setPendingSale(sale);
      return;
    }
    setPendingSale(null);
    setError("");
    if (sale.status === "paid") handlers.current.onPaid(sale);
    else
      void handlers.current.onClosed(
        CLOSED_MESSAGES[sale.status ?? ""] || CLOSED_MESSAGES.failed,
      );
  }, []);

  const saleId = pendingSale?.id;
  useEffect(() => {
    if (!saleId) return;
    let inFlight = false;
    const timer = setInterval(async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const data = await api<{ transaction: Sale }>(
          `transactions/${saleId}/payment`,
        );
        settle(data.transaction);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        inFlight = false;
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [saleId, settle]);

  async function run(action: "cancel" | "simulate-payment") {
    if (!saleId || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await api<{ transaction: Sale }>(
        `transactions/${saleId}/${action}`,
        "POST",
      );
      settle(data.transaction);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return {
    pendingSale,
    start: settle,
    cancel: () => run("cancel"),
    simulate: () => run("simulate-payment"),
    qrisBusy: busy,
    qrisError: error,
  };
}
export type QrisPaymentState = ReturnType<typeof useQrisPayment>;
