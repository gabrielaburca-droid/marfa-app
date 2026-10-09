"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./button";

export function SubmitButton({
  children,
  pendingText = "Se salvează…",
  className = "",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending && (
        <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
      )}
      {pending ? pendingText : children}
    </Button>
  );
}
