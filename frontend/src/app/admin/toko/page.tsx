import type { Metadata } from "next";
import { StoreSettingsPage } from "@/components/store/store-settings-page";

// Temporary: see RoleGate note in the parent layout.
export const instant = false;

export const metadata: Metadata = { title: "Pengaturan Toko" };

export default function AdminStorePage() {
  return <StoreSettingsPage />;
}
