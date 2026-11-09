"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type User } from "@/lib/types";
import { Brand } from "@/components/shared/brand";
import { api } from "@/lib/api";
import { Login } from "@/components/auth/login";
import { Register } from "@/components/auth/register";
import { AppShell } from "@/components/layout/app-shell";
import { adminNav, cashierNav } from "@/components/layout/navigation";
import { Workspace } from "@/components/workspace/workspace";

export function StoreApp() {
  const path = usePathname();
  const [segmentPath] = useState(path);
  const active = path === segmentPath;
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const loadSession = useCallback(async () => {
    setSessionError("");
    try {
      const data = await api<{ user: User }>("session");
      setUser(data.user);
    } catch (e) {
      setSessionError((e as Error).message);
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => {
    if (!active) return;
    const expired = () => router.replace("/login");
    window.addEventListener("kotong-unauthorized", expired);
    if (path !== "/login" && path !== "/register")
      void Promise.resolve().then(loadSession);
    return () => window.removeEventListener("kotong-unauthorized", expired);
  }, [active, loadSession, path, router]);
  useEffect(() => {
    if (
      active &&
      user &&
      (path === "/" ||
        (user.role === "cashier" && path.startsWith("/admin")) ||
        (user.role === "admin" && path.startsWith("/kasir")))
    )
      router.replace(user.role === "admin" ? "/admin" : "/kasir/transaksi");
  }, [active, user, path, router]);
  if (!active) return null;
  if (path === "/login")
    return (
      <Login
        onLogin={(u) => {
          setUser(u);
          router.replace(u.role === "admin" ? "/admin" : "/kasir/transaksi");
        }}
      />
    );
  if (path === "/register")
    return (
      <Register
        onRegister={(u) => {
          setUser(u);
          router.replace(u.role === "admin" ? "/admin" : "/kasir/transaksi");
        }}
      />
    );
  if (!ready) return <div className="loading">Menyiapkan toko…</div>;
  if (!user)
    return (
      <main className="connection">
        <Brand />
        <AlertCircle />
        <h1>Toko belum terhubung</h1>
        <p>{sessionError}</p>
        <Button onClick={loadSession}>Coba lagi</Button>
        <Link href="/login">Kembali ke halaman masuk</Link>
      </main>
    );
  if (
    (user.role === "cashier" && path.startsWith("/admin")) ||
    (user.role === "admin" && path.startsWith("/kasir")) ||
    path === "/"
  )
    return <div className="loading">Membuka toko…</div>;
  const nav = user.role === "admin" ? adminNav : cashierNav;
  if (
    !nav.some(([, url]) => url === path) &&
    path !== "/kasir/berhasil" &&
    path !== "/"
  )
    return (
      <div className="connection">
        <h1>Halaman tidak ditemukan</h1>
        <Link href={user.role === "admin" ? "/admin" : "/kasir/transaksi"}>
          Kembali ke toko
        </Link>
      </div>
    );
  return (
    <AppShell
      user={user}
      path={path}
      onLogout={async () => {
        await api("logout", "POST");
        try {
          sessionStorage.removeItem("kotong-receipt");
        } catch {}
        setUser(null);
        router.replace("/login");
      }}
    >
      <Workspace key={path} path={path} user={user} />
    </AppShell>
  );
}
