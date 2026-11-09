"use client";
import { useState, type FormEvent } from "react";
import { ShoppingBasket, ArrowUpRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type User } from "@/lib/types";
import { Brand } from "@/components/shared/brand";
import { Field } from "@/components/shared/fields";
import { api } from "@/lib/api";

export function Login({ onLogin }: { onLogin: (user: User) => void }) {
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
          <p>Masuk dengan akun yang diberikan admin toko.</p>
          <form onSubmit={submit}>
            <Field label="Email">
              <input
                name="email"
                type="email"
                autoComplete="username"
                placeholder="nama@tokoberkah.id"
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
                {error}
              </p>
            )}
            <Button type="submit" className="primary wide" disabled={busy}>
              {busy ? "Sedang masuk…" : "Masuk"}
              <ArrowUpRight size={17} />
            </Button>
          </form>
          <p className="login-help">Kesulitan masuk? Hubungi admin toko.</p>
        </div>
      </section>
    </main>
  );
}
