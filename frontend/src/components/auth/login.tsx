"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ShoppingBasket,
  ArrowUpRight,
  AlertCircle,
  Store,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type User } from "@/lib/types";
import { Brand } from "@/components/shared/brand";
import { Field } from "@/components/shared/fields";
import { api } from "@/lib/api";

export function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [role, setRole] = useState<"admin" | "cashier">("admin");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const data = await api<{ user: User }>("auth/login", "POST", {
        email: f.get("email"),
        password: f.get("password"),
        role,
      });
      try {
        sessionStorage.removeItem("kotong-receipt");
      } catch {}
      onLogin(data.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <Brand />
        <div>
          <span className="eyebrow">TEMAN SEHARI-HARI TOKO ANDA</span>
          <h1>
            Jualan lancar.
            <br />
            Stok teratur.
          </h1>
          <p>
            Satu tempat untuk mencatat penjualan dan menjaga persediaan toko
            tetap siap.
          </p>
          <div className="login-sample">
            <ShoppingBasket size={28} />
            <strong>Setiap belanja, tercatat rapi.</strong>
            <span>Dari kebutuhan kecil sampai belanja bulanan.</span>
          </div>
        </div>
        <small>KOTONG · Kasir & persediaan</small>
      </section>
      <section className="login-form">
        <div>
          <span className="eyebrow">SELAMAT DATANG KEMBALI</span>
          <h2>Siap buka toko?</h2>
          <p>
            {role === "admin"
              ? "Masuk sebagai Admin untuk mengelola produk, stok, laporan, dan kasir."
              : "Masuk dengan akun Kasir yang diberikan oleh admin toko."}
          </p>
          <div className="role-switch" role="group" aria-label="Pilih peran masuk">
            <button
              type="button"
              className={role === "admin" ? "role-option active" : "role-option"}
              aria-pressed={role === "admin"}
              onClick={() => {
                setRole("admin");
                setError("");
              }}
            >
              <Store size={15} />
              Admin
            </button>
            <button
              type="button"
              className={
                role === "cashier" ? "role-option active" : "role-option"
              }
              aria-pressed={role === "cashier"}
              onClick={() => {
                setRole("cashier");
                setError("");
              }}
            >
              <Users size={15} />
              Kasir
            </button>
          </div>
          <form onSubmit={submit}>
            <Field label="Email">
              <input
                name="email"
                type="email"
                autoComplete="username"
                placeholder={
                  role === "admin"
                    ? "admin@tokoberkah.id"
                    : "kasir@tokoberkah.id"
                }
                required
                maxLength={254}
              />
            </Field>
            <Field label="Kata sandi">
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Masukkan kata sandi"
                required
              />
            </Field>
            {error && (
              <p role="alert" className="error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Sedang masuk…" : "Masuk"}
              <ArrowUpRight size={17} />
            </Button>
          </form>
          {role === "admin" ? (
            <p className="login-help">
              Belum punya akun admin?{" "}
              <Link href="/register">Daftar akun Admin</Link>
            </p>
          ) : (
            <p className="login-help">
              Akun kasir dibuat oleh admin toko. Kesulitan masuk? Hubungi admin.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
