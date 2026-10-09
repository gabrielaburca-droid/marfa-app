"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/toast";
import type { FormState } from "@/lib/validation/auth";

/**
 * A form panel opened by a URL such as `/incasari?nou=targ`, so the quick
 * actions and the back button work. Closing it goes to `closeHref`.
 */
export function Sheet({
  title,
  closeHref,
  children,
}: {
  title: string;
  closeHref: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const close = () => router.replace(closeHref, { scroll: false });

  return (
    <dialog
      ref={ref}
      aria-labelledby="sheet-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-canvas p-0 shadow-2xl backdrop:bg-stone-900/30 backdrop:backdrop-blur-[2px] sm:m-auto sm:rounded-3xl"
    >
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="sheet-title" className="text-lg font-bold text-stone-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={close}
            className="flex size-9 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-200/60"
            aria-label="Închide"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

/** After a save: toast, then close the sheet and show the entry's month. */
export function useSaved(state: FormState & { month?: string }, path: string) {
  const router = useRouter();
  const toast = useToast();
  useEffect(() => {
    if (!state.message) return;
    toast({ tone: state.ok ? "success" : "error", message: state.message });
    if (state.ok) router.replace(`${path}?luna=${state.month}`, { scroll: false });
  }, [state, toast, router, path]);
}
