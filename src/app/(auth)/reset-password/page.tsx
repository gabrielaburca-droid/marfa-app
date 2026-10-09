"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { updatePassword } from "../actions";

export default function ResetPasswordPage() {
  const [state, action] = useActionState(updatePassword, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <h1 className="text-lg font-bold text-stone-900">Setați parola</h1>
      {state.message && <Alert tone="error">{state.message}</Alert>}
      <Field
        label="Parolă nouă"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="Minimum 10 caractere."
        required
        errors={state.fieldErrors?.password}
      />
      <Field
        label="Confirmați parola"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.confirm}
      />
      <SubmitButton className="w-full">Salvează parola</SubmitButton>
    </form>
  );
}
