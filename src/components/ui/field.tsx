import type { InputHTMLAttributes } from "react";

export const inputClass =
  "block w-full rounded-lg border-0 bg-white px-3 py-2.5 text-base text-slate-900 ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-600 sm:text-sm aria-[invalid=true]:ring-red-500";

export function Field({
  label,
  name,
  errors,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
}) {
  const errorId = errors?.length ? `${name}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className={inputClass}
        aria-invalid={Boolean(errorId)}
        aria-describedby={errorId}
        {...props}
      />
      {hint && !errorId && <p className="text-xs text-slate-500">{hint}</p>}
      {errorId && (
        <p id={errorId} className="text-sm text-red-600">
          {errors![0]}
        </p>
      )}
    </div>
  );
}
