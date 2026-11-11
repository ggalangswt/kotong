import Link from "next/link";
import { Brand } from "@/components/shared/brand";

export default function NotFound() {
  return (
    <main className="connection">
      <Brand />
      <h1>Halaman tidak ditemukan</h1>
      <p>Alamat yang Anda buka tidak tersedia.</p>
      <Link href="/login">Kembali ke toko</Link>
    </main>
  );
}
