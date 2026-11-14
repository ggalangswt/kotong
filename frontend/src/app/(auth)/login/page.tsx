import type { Metadata } from "next";
import { Login } from "@/components/auth/login";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return <Login />;
}
