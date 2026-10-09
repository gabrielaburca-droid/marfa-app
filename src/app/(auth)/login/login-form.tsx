"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { signIn } from "../actions";

export function LoginForm({ linkExpired }: { linkExpired: boolean }) {
  const [state, action] = useActionState(signIn, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <h1 className="text-lg font-bold text-stone-900">Autentificare</h1>
      {linkExpired && <Alert tone="error">Linkul a expirat sau a fost deja folosit.</Alert>}
      {state.message && <Alert tone="error">{state.message}</Alert>}
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        errors={state.fieldErrors?.email}
      />
      <Field
        label="Parolă"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        errors={state.fieldErrors?.password}
      />
      <SubmitButton className="w-full" pendingText="Se conectează…">
        Intră în cont
      </SubmitButton>
      <p className="text-center text-sm">
        <Link href="/forgot-password" className="font-medium text-brand-700 hover:underline">
          Ați uitat parola?
        </Link>
      </p>
    </form>
  );
}
