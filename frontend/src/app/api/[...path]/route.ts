import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { User } from "@/lib/types";
const cookieName = "kotong-session";
function sign(value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET");
  return createHmac("sha256", secret).update(value).digest("hex");
}
function unpack(value?: string): { token: string; user: User } | null {
  if (!value) return null;
  try {
    const [body, signature] = value.split(".");
    const expected = sign(body);
    if (
      !signature ||
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      return null;
    return JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
}
async function handle(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const path = (await context.params).path.join("/");
  const jar = await cookies();
  const mutation = request.method !== "GET";
  if (mutation && request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json(
      { error: "Permintaan tidak diizinkan." },
      { status: 403 },
    );
  if (path === "logout" && request.method === "POST") {
    jar.delete(cookieName);
    return Response.json({ ok: true });
  }
  const auth =
    (path === "auth/login" || path === "auth/register") &&
    request.method === "POST";
  const allowed =
    (request.method === "GET" &&
      /^(session|products|products\/[a-f\d]{24}\/stock-movements|transactions(?:\/[a-f\d]{24})?|cashiers)$/.test(
        path,
      )) ||
    (request.method === "POST" &&
      /^(auth\/login|auth\/register|products|products\/[a-f\d]{24}\/stock-adjustments|transactions|cashiers)$/.test(
        path,
      )) ||
    (request.method === "PATCH" &&
      /^(products\/[a-f\d]{24}|cashiers\/[a-f\d]{24}\/status)$/.test(path)) ||
    (request.method === "DELETE" && /^products\/[a-f\d]{24}$/.test(path));
  if (!allowed)
    return Response.json({ error: "Tidak ditemukan." }, { status: 404 });
  const session = unpack(jar.get(cookieName)?.value);
  if (!auth && !session)
    return Response.json({ error: "Silakan masuk kembali." }, { status: 401 });
  try {
    const backend = process.env.KOTONG_API_URL || "http://localhost:4000";
    const response = await fetch(
      `${backend}/api/${path === "session" ? "products" : path}`,
      {
        method: request.method,
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
        },
        body: mutation ? await request.text() : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );
    const data = await response.json();
    if (response.status === 401) jar.delete(cookieName);
    if (auth && response.ok) {
      const body = Buffer.from(JSON.stringify(data)).toString("base64url");
      jar.set(cookieName, `${body}.${sign(body)}`, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 8 * 3600,
      });
      return Response.json(
        { user: data.user },
        { status: response.status, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (path === "session" && response.ok)
      return Response.json(
        { user: session!.user },
        { headers: { "Cache-Control": "no-store" } },
      );
    return Response.json(data, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Layanan toko belum terhubung. Coba lagi sebentar." },
      { status: 502 },
    );
  }
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
