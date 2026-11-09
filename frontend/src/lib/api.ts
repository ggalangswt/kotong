export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && path !== "auth/login")
      window.dispatchEvent(new Event("kotong-unauthorized"));
    throw new Error(
      (
        {
          "Insufficient stock":
            "Stok tidak mencukupi. Periksa kembali keranjang.",
          "Invalid email or password": "Email atau kata sandi tidak sesuai.",
          "Email already in use": "Email sudah digunakan.",
          Forbidden: "Anda tidak memiliki akses untuk tindakan ini.",
          "Product not found": "Produk sudah tidak tersedia.",
        } as Record<string, string>
      )[data.error] ||
        (response.status === 429
          ? "Terlalu banyak percobaan. Silakan coba lagi nanti."
          : data.error || "Permintaan gagal. Coba kembali."),
    );
  }
  return data;
}
