"use client";
import { type ReactNode } from "react";
import Link from "next/link";
import { LogOut, ChevronRight } from "lucide-react";
import { type User } from "@/lib/types";
import { Brand } from "@/components/shared/brand";
import { adminNav, cashierNav } from "@/components/layout/navigation";
import { storeInitial, useStore } from "@/components/session/store-context";

export function AppShell({
  user,
  path,
  children,
  onLogout,
}: {
  user: User;
  path: string;
  children: ReactNode;
  onLogout: () => Promise<void>;
}) {
  const nav = user.role === "admin" ? adminNav : cashierNav;
  const { store, isLoaded } = useStore();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="store-label" aria-busy={!isLoaded}>
          <span className="store-avatar" aria-hidden="true">
            {storeInitial(store.name)}
          </span>
          <div>
            <strong>{store.name}</strong>
            {store.type && <small>{store.type}</small>}
          </div>
        </div>
        <p className="nav-label">RUANG KERJA</p>
        <nav>
          {nav.map(([title, url, Icon]) => (
            <Link
              key={url}
              className={path === url ? "nav-item active" : "nav-item"}
              href={url}
            >
              <Icon size={18} />
              <span>{title}</span>
              {path === url && <ChevronRight size={15} />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="staff">
            <span>{user.name.slice(0, 1)}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.role === "admin" ? "Admin toko" : "Kasir"}</small>
            </div>
          </div>
          <button className="logout" onClick={onLogout}>
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>
      <main className="main">
        <div className="topbar">
          <span>
            {store.name} <ChevronRight size={13} />{" "}
            {user.role === "admin" ? "Pengelolaan toko" : "Ruang kasir"}
          </span>
          <span>
            <i className="online-dot" />
            Sesi aktif <b>•</b>{" "}
            {new Intl.DateTimeFormat("id-ID", {
              dateStyle: "long",
              timeZone: "Asia/Jakarta",
            }).format(new Date())}
          </span>
        </div>
        {children}
      </main>
    </div>
  );
}
