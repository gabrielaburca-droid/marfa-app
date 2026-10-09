import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Autentificare" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { eroare } = await searchParams;
  return <LoginForm linkExpired={eroare === "link"} />;
}
