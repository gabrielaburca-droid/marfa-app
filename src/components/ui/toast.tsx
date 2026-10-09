"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { FormState } from "@/lib/validation/auth";

type Toast = { id: number; tone: "success" | "error"; message: string };

const ToastContext = createContext<(t: Omit<Toast, "id">) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = ++nextId.current;
    setToasts((all) => [...all, { ...t, id }]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), t.tone === "error" ? 7000 : 3500);
  }, []);

  return (
    <ToastContext value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-lg ring-1 ${
              t.tone === "error"
                ? "bg-red-600 text-white ring-red-700"
                : "bg-slate-900 text-white ring-slate-800"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/** Shows a toast each time a server action returns a new message. */
export function useActionToast(state: FormState, onSuccess?: () => void) {
  const toast = useToast();
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });
  useEffect(() => {
    if (!state.message) return;
    toast({ tone: state.ok ? "success" : "error", message: state.message });
    if (state.ok) onSuccessRef.current?.();
  }, [state, toast]);
}
