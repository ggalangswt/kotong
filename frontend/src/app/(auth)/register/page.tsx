import type { Metadata } from "next";
import { Register } from "@/components/auth/register";

export const metadata: Metadata = { title: "Daftar Admin" };

export default function RegisterPage() {
  return <Register />;
}
