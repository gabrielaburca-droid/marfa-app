import type { SelectHTMLAttributes } from "react";
import { inputClass } from "./field";

export function SelectField({
  label,
  name,
  errors,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; name: string; errors?: string[] }) {
  const errorId = errors?.length ? `${props.id ?? name}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={props.id ?? name} className="block text-sm font-medium text-stone-600">
        {label}
      </label>
      <select
        id={props.id ?? name}
        name={name}
        className={`${inputClass} pr-8`}
        aria-invalid={Boolean(errorId)}
        aria-describedby={errorId}
        {...props}
      >
        {children}
      </select>
      {errorId && (
        <p id={errorId} className="text-sm text-rose-600">
          {errors![0]}
        </p>
      )}
    </div>
  );
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 rounded border-stone-300 text-brand-600 accent-brand-600"
      />
      <span>
        <span className="font-medium text-stone-700">{label}</span>
        {hint && <span className="block text-xs text-stone-500">{hint}</span>}
      </span>
    </label>
  );
}
