"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, ArrowUpRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type User } from "@/lib/types";
import { Brand } from "@/components/shared/brand";
import { Field } from "@/components/shared/fields";
import { api } from "@/lib/api";
import { homeFor } from "@/components/layout/navigation";

export function Register() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "").trim();
    const email = String(f.get("email") || "").trim();
    const password = String(f.get("password") || "");
    const confirmPassword = String(f.get("confirmPassword") || "");

    if (password.length < 8 || password.length > 128) {
      setError("Kata sandi wajib terdiri dari 8–128 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setBusy(true);
    try {
      const data = await api<{ user: User }>("auth/register", "POST", {
        name,
        email,
        password,
      });
      try {
        sessionStorage.removeItem("kotong-receipt");
      } catch {}
      router.replace(homeFor(data.user.role));
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
          <span className="eyebrow">PENDAFTARAN PENGELOLA TOKO</span>
          <h1>
            Mulai kelola
            <br />
            toko Anda.
          </h1>
          <p>
            Buat akun Admin untuk mengatur produk, memantau stok menipis,
            melihat laporan penjualan, dan mengelola akun kasir.
          </p>
          <div className="login-sample">
            <Store size={28} />
            <strong>Khusus pendaftaran Admin Toko.</strong>
            <span>
              Akun kasir hanya dibuat melalui menu Akun Kasir oleh Admin setelah
              masuk.
            </span>
          </div>
        </div>
        <small>KOTONG · Kasir & persediaan</small>
      </section>
      <section className="login-form">
        <div>
          <span className="eyebrow">REGISTRASI ADMIN</span>
          <h2>Buat akun Admin</h2>
          <p>
            Daftarkan akun pengelola toko baru untuk langsung masuk ke ruang
            kerja Admin.
          </p>
          <form onSubmit={submit}>
            <Field label="Nama lengkap">
              <input
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Nama pemilik atau pengelola"
                required
                maxLength={100}
              />
            </Field>
            <Field label="Email">
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="admin@tokoberkah.id"
                required
                maxLength={254}
              />
            </Field>
            <Field label="Kata sandi">
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Minimal 8 karakter"
                required
                minLength={8}
                maxLength={128}
              />
            </Field>
            <Field label="Konfirmasi kata sandi">
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Ulangi kata sandi"
                required
                minLength={8}
                maxLength={128}
              />
            </Field>
            {error && (
              <p role="alert" className="error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Sedang mendaftar…" : "Daftar sebagai Admin"}
              <ArrowUpRight size={17} />
            </Button>
          </form>
          <p className="login-help">
            Sudah punya akun? <Link href="/login">Masuk di sini</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
