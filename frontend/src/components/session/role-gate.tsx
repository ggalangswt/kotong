"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/shared/brand";
import { AppShell } from "@/components/layout/app-shell";
import { StoreProvider } from "@/components/session/store-context";
import { homeFor, type Role } from "@/components/layout/navigation";
import { api, ApiError } from "@/lib/api";
import { type User } from "@/lib/types";

const RECEIPT_KEY = "kotong-receipt";
const UNAUTHORIZED_EVENT = "kotong-unauthorized";

const SessionUserContext = createContext<User | null>(null);

export function useSessionUser(): User {
  const user = useContext(SessionUserContext);
  if (!user) throw new Error("useSessionUser must be used inside RoleGate");
  return user;
}

export function RoleGate({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  // The error screen is driven only by an actual failure. "No user yet" always means "still loading":
  // Next keeps this component's state while another route is shown, so after logout -> login it comes
  // back with user === null for a moment and must not flash "Toko belum terhubung".
  const [sessionError, setSessionError] = useState("");

  const loadSession = useCallback(async () => {
    setSessionError("");
    try {
      const data = await api<{ user: User }>("session");
      setUser(data.user);
    } catch (e) {
      // 401: the unauthorized listener is already redirecting to /login.
      if (e instanceof ApiError && e.status === 401) return;
      setSessionError((e as Error).message || "Sesi tidak dapat dimuat.");
    }
  }, []);

  useEffect(() => {
    const expired = () => router.replace("/login");
    window.addEventListener(UNAUTHORIZED_EVENT, expired);
    void Promise.resolve().then(loadSession);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, expired);
  }, [loadSession, router]);

  const wrongRole = user !== null && user.role !== role;
  useEffect(() => {
    if (wrongRole) router.replace(homeFor(user.role));
  }, [wrongRole, user, router]);

  async function logout() {
    await api("logout", "POST");
    try {
      sessionStorage.removeItem(RECEIPT_KEY);
    } catch {}
    setUser(null);
    router.replace("/login");
  }

  if (!user && !sessionError)
    return <div className="loading">Menyiapkan toko…</div>;
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
  if (wrongRole) return <div className="loading">Membuka toko…</div>;

  return (
    <SessionUserContext.Provider value={user}>
      <StoreProvider>
        <AppShell user={user} path={path} onLogout={logout}>
          {children}
        </AppShell>
      </StoreProvider>
    </SessionUserContext.Provider>
  );
}
