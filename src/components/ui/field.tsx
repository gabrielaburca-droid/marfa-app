import type { InputHTMLAttributes } from "react";

export const inputClass =
  "block w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-base text-stone-900 shadow-[0_1px_1px_rgb(51_42_36/0.03)] ring-1 ring-stone-200 transition-shadow placeholder:text-stone-400 hover:ring-stone-300 focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-stone-50 disabled:text-stone-500 sm:text-sm aria-[invalid=true]:ring-rose-400 aria-[invalid=true]:focus:ring-rose-500";

export function Field({
  label,
  name,
  errors,
  hint,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
}) {
  const inputId = id ?? name;
  const errorId = errors?.length ? `${inputId}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-semibold text-stone-700">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        className={inputClass}
        aria-invalid={Boolean(errorId)}
        aria-describedby={errorId}
        {...props}
      />
      {hint && !errorId && <p className="text-xs text-stone-500">{hint}</p>}
      {errorId && (
        <p id={errorId} className="text-sm font-medium text-rose-700">
          {errors![0]}
        </p>
      )}
    </div>
  );
}
