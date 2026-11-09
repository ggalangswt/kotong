"use client";
import { type ReactNode } from "react";
import { Chip } from "@heroui/react";
import { Package } from "lucide-react";

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
