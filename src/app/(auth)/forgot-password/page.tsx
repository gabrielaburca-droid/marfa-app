"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { requestPasswordReset } from "../actions";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(requestPasswordReset, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <div>
        <h1 className="text-xl font-semibold">Resetare parolă</h1>
        <p className="mt-1 text-sm text-slate-500">Vă trimitem un link pentru a seta o parolă nouă.</p>
      </div>
      {state.message && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}
      <Field label="Email" name="email" type="email" autoComplete="email" required errors={state.fieldErrors?.email} />
      <SubmitButton className="w-full" pendingText="Se trimite…">
        Trimite linkul
      </SubmitButton>
      <p className="text-center text-sm">
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Înapoi la autentificare
        </Link>
      </p>
    </form>
  );
}
