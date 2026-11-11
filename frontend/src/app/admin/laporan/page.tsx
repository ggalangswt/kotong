import type { Metadata } from "next";
import { WorkspaceRoute } from "@/components/workspace/workspace-route";

// Temporary: see RoleGate note in the parent layout.
export const instant = false;

export const metadata: Metadata = { title: "Laporan Penjualan" };

export default function AdminReportsPage() {
  return <WorkspaceRoute path="/admin/laporan" />;
}
