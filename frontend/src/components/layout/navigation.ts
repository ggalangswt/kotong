"use client";
import {
  ShoppingBasket,
  LayoutDashboard,
  Package,
  Boxes,
  ReceiptText,
  ChartNoAxesColumn,
  Users,
  History,
} from "lucide-react";

export const adminNav = [
  ["Ringkasan", "/admin", LayoutDashboard],
  ["Produk", "/admin/produk", Package],
  ["Stok", "/admin/stok", Boxes],
  ["Transaksi", "/admin/transaksi", ReceiptText],
  ["Laporan", "/admin/laporan", ChartNoAxesColumn],
  ["Akun Kasir", "/admin/kasir", Users],
] as const;
export const cashierNav = [
  ["Transaksi", "/kasir/transaksi", ShoppingBasket],
  ["Riwayat Saya", "/kasir/riwayat", History],
] as const;
