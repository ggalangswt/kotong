"use client";
import { useSessionUser } from "@/components/session/role-gate";
import { Workspace } from "@/components/workspace/workspace";

export function WorkspaceRoute({ path }: { path: string }) {
  const user = useSessionUser();
  return <Workspace key={path} path={path} user={user} />;
}
