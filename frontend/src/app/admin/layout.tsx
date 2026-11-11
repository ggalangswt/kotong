import type { ReactNode } from "react";
import { RoleGate } from "@/components/session/role-gate";

// Session is resolved client-side in RoleGate, so child segments cannot be
// prerendered for instant navigation yet. Remove once auth moves to the server.
export const instant = false;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RoleGate role="admin">{children}</RoleGate>;
}
