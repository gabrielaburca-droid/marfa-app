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
            ? "text-sm font-medium text-stone-500 hover:text-rose-600"
            : "text-sm font-medium text-stone-600 hover:text-stone-900")
        }
      >
        {label}
      </button>
      <dialog
        ref={ref}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl p-0 shadow-2xl backdrop:bg-stone-900/30 backdrop:backdrop-blur-[2px]"
        aria-labelledby="confirm-title"
      >
        <div className="space-y-3 p-6">
          <h2 id="confirm-title" className="text-lg font-bold text-stone-900">
            {title}
          </h2>
          <p className="text-sm text-stone-600">{description}</p>
        </div>
        <div className="flex justify-end gap-2 px-6 pb-6">
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
