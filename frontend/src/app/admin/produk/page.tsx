import type { Metadata } from "next";
import { WorkspaceRoute } from "@/components/workspace/workspace-route";

// Temporary: see RoleGate note in the parent layout.
export const instant = false;

export const metadata: Metadata = { title: "Produk" };

export default function AdminProductsPage() {
  return <WorkspaceRoute path="/admin/produk" />;
}
