"use client";
import { type ReactNode } from "react";
import { Chip } from "@heroui/react";
import { Package, Check, X } from "lucide-react";

export function Badge({
  children,
  low = false,
}: {
  children: ReactNode;
  low?: boolean;
}) {
  return (
    <Chip className={low ? "stock-badge low" : "stock-badge"} size="sm">
      {children}
    </Chip>
  );
}
export function Empty({
  title = "Belum ada data",
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Package size={28} />
      <h3>{title}</h3>
      <p>{children || "Data akan muncul di sini setelah aktivitas pertama."}</p>
    </div>
  );
}

export function Toast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  if (!message) return null;
  return (
    <div
      className="notification-toast"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="notification-toast-icon" aria-hidden="true">
        <Check size={17} />
      </span>
      <span className="notification-toast-message">{message}</span>
      <button
        type="button"
        className="notification-toast-dismiss"
        aria-label="Tutup notifikasi"
        onClick={onDismiss}
      >
        <X size={16} />
      </button>
    </div>
  );
}
