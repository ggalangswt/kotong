export async function apiResponse(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<Response> {
  const response = await fetch(`/api/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    if (
      response.status === 401 &&
      path !== "auth/login" &&
      path !== "auth/register"
    )
      window.dispatchEvent(new Event("kotong-unauthorized"));
    const data = await response.json();
    throw new Error(
      (
        {
          "Insufficient stock":
            "Stok tidak mencukupi. Periksa kembali keranjang.",
          "Invalid email or password": "Email atau kata sandi tidak sesuai.",
          "Account is not an admin":
            "Akun ini bukan akun Admin. Silakan pilih masuk sebagai Kasir.",
          "Account is not a cashier":
            "Akun ini bukan akun Kasir. Silakan pilih masuk sebagai Admin.",
          "Email already in use": "Email sudah digunakan.",
          "Invalid report date range": "Periode laporan tidak valid.",
          "Valid name, email, and password (8-128 characters) are required":
            "Nama, email, dan kata sandi (8–128 karakter) wajib diisi dengan benar.",
          Forbidden: "Anda tidak memiliki akses untuk tindakan ini.",
          "Product not found": "Produk sudah tidak tersedia.",
          "Store name must be 1-100 characters":
            "Nama toko wajib diisi, maksimal 100 karakter.",
          "Store type must be 1-60 characters":
            "Jenis toko wajib diisi, maksimal 60 karakter.",
        } as Record<string, string>
      )[data.error] ||
        (response.status === 429
          ? "Terlalu banyak percobaan. Silakan coba lagi nanti."
          : data.error || "Permintaan gagal. Coba kembali."),
    );
  }
  return response;
}

export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await apiResponse(path, method, body);
  return response.json();
}
