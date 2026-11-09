import { Suspense } from "react";
import { StoreApp } from "@/components/store-app";
export default function Page() {
  return (
    <Suspense fallback={<p className="loading">Menyiapkan toko…</p>}>
      <StoreApp />
    </Suspense>
  );
}
