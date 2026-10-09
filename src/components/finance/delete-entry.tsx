"use client";

import { Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { FormState } from "@/lib/validation/auth";

export function DeleteEntry({
  id,
  what,
  action,
}: {
  id: string;
  what: string;
  action: (id: string) => Promise<FormState>;
}) {
  const toast = useToast();
  return (
    <ConfirmButton
      label={
        <>
          <Trash2 className="size-4" aria-hidden />
          <span className="sr-only">Șterge {what}</span>
        </>
      }
      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600"
      title={`Ștergi ${what}?`}
      description="Dispare din liste și din rapoarte. Rămâne în istoricul modificărilor."
      confirmLabel="Șterge"
      onConfirm={async () => {
        const r = await action(id);
        if (r.message) toast({ tone: r.ok ? "success" : "error", message: r.message });
      }}
    />
  );
}
