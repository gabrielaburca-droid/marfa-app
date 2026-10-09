"use client";

import { useRef, useTransition } from "react";
import { Button } from "./button";

/**
 * A button that asks for confirmation in a modal before running `onConfirm`.
 */
export function ConfirmButton({
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
  variant = "danger",
  className = "",
}: {
  label: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
  variant?: "danger" | "secondary";
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className={
          className ||
          (variant === "danger"
            ? "text-sm font-medium text-red-600 hover:text-red-700"
            : "text-sm font-medium text-slate-600 hover:text-slate-900")
        }
      >
        {label}
      </button>
      <dialog
        ref={ref}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl p-0 shadow-xl backdrop:bg-slate-900/40"
        aria-labelledby="confirm-title"
      >
        <div className="space-y-3 p-6">
          <h2 id="confirm-title" className="text-lg font-semibold">
            {title}
          </h2>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <div className="flex justify-end gap-2 bg-slate-50 px-6 py-4">
          <Button variant="secondary" type="button" onClick={() => ref.current?.close()}>
            Renunță
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await onConfirm();
                ref.current?.close();
              })
            }
          >
            {pending ? "Se procesează…" : confirmLabel}
          </Button>
        </div>
      </dialog>
    </>
  );
}
