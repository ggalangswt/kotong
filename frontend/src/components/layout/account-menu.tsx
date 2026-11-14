"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronsUpDown, LogOut, Store } from "lucide-react";
import { type User } from "@/lib/types";

type AccountMenuProps = {
  user: User;
  path: string;
  onLogout: () => Promise<void>;
};

const STORE_SETTINGS_PATH = "/admin/toko";

export function AccountMenu({ user, path, onLogout }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const isAdmin = user.role === "admin";

  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  // Close after navigating (e.g. opening Pengaturan Toko).
  const [lastPath, setLastPath] = useState(path);
  if (lastPath !== path) {
    setLastPath(path);
    setIsOpen(false);
  }

  return (
    <div className="account-menu" ref={rootRef}>
      {isOpen && (
        <div className="account-popover" id={menuId} role="menu">
          {isAdmin && (
            <Link
              role="menuitem"
              className={
                path === STORE_SETTINGS_PATH
                  ? "account-item active"
                  : "account-item"
              }
              href={STORE_SETTINGS_PATH}
            >
              <Store size={16} />
              Pengaturan Toko
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            className="account-item danger"
            onClick={() => void onLogout()}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      )}
      <button
        ref={triggerRef}
        type="button"
        className="staff"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-label={`Menu akun ${user.name}`}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="staff-avatar" aria-hidden="true">
          {user.name.slice(0, 1)}
        </span>
        <span className="staff-text">
          <strong>{user.name}</strong>
          <small>{isAdmin ? "Admin toko" : "Kasir"}</small>
        </span>
        <ChevronsUpDown
          className="staff-chevron"
          size={15}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
