"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { rupiah } from "@/lib/business";
import { type QrisPaymentState } from "@/components/cashier/use-qris-payment";

function useCountdown(expiresAt?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!expiresAt) return null;
  const seconds = Math.max(0, Math.floor((Date.parse(expiresAt) - now) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

type Props = Pick<
  QrisPaymentState,
  "pendingSale" | "cancel" | "simulate" | "qrisBusy" | "qrisError"
>;

export function QrisDialog({
  pendingSale,
  cancel,
  simulate,
  qrisBusy,
  qrisError,
}: Props) {
  const remaining = useCountdown(pendingSale?.payment?.expiresAt);
  const qrString = pendingSale?.payment?.qrString;
  // The backend decides: true only while Xendit runs with a test key (it also refuses simulation otherwise).
  const canSimulate = pendingSale?.payment?.testMode === true;
  return (
    // Closing by backdrop/Escape is disabled: the cashier must cancel explicitly so stock is returned.
    <Dialog open={pendingSale !== null} disablePointerDismissal>
      <DialogContent
        className="kotong-dialog qris-dialog"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Scan QRIS untuk membayar</DialogTitle>
          <DialogDescription>
            Minta pelanggan memindai kode di bawah dengan aplikasi bank atau
            e-wallet.
          </DialogDescription>
        </DialogHeader>
        {qrisError && (
          <p className="error" role="alert">
            {qrisError}
          </p>
        )}
        <div className="qris-code">
          {qrString ? (
            <QRCodeSVG value={qrString} size={220} marginSize={2} />
          ) : (
            <p className="error">Kode QR tidak tersedia.</p>
          )}
        </div>
        <div className="qris-meta">
          <strong>{rupiah(pendingSale?.totalAmount ?? 0)}</strong>
          <span role="status">
            <LoaderCircle size={14} className="animate-spin" />
            Menunggu pembayaran
            {remaining ? ` · berlaku ${remaining}` : ""}
          </span>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={qrisBusy} onClick={cancel}>
            Batalkan
          </Button>
          {canSimulate && (
            <Button disabled={qrisBusy} onClick={simulate}>
              Simulasikan bayar (test)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
