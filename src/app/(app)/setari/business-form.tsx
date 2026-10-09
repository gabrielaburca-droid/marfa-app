"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useActionToast } from "@/components/ui/toast";
import { COMMON_CURRENCIES, CURRENCY_NAMES } from "@/lib/currencies";
import { updateBusiness } from "./actions";

type Business = {
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  registration_number: string | null;
  address: string | null;
  enabled_currencies: string[];
};

export function BusinessForm({ business }: { business: Business }) {
  const [state, action] = useActionState(updateBusiness, {});
  useActionToast(state);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nume afișat" name="name" defaultValue={business.name} required errors={e.name} />
        <Field
          label="Denumire legală"
          name="legal_name"
          defaultValue={business.legal_name ?? ""}
          errors={e.legal_name}
        />
        <Field label="CUI" name="tax_id" defaultValue={business.tax_id ?? ""} errors={e.tax_id} />
        <Field
          label="Nr. Registrul Comerțului"
          name="registration_number"
          defaultValue={business.registration_number ?? ""}
          errors={e.registration_number}
        />
        <div className="sm:col-span-2">
          <Field label="Adresă" name="address" defaultValue={business.address ?? ""} errors={e.address} />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Monede folosite</legend>
        <p className="mt-0.5 text-xs text-slate-500">
          Rapoartele sunt în RON. Monedele bifate apar în formularele de încasări și cheltuieli.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input type="checkbox" checked disabled className="size-4 accent-brand-600" /> RON
          </label>
          {COMMON_CURRENCIES.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm" title={CURRENCY_NAMES[c]}>
              <input
                type="checkbox"
                name="currencies"
                value={c}
                defaultChecked={business.enabled_currencies.includes(c)}
                className="size-4 accent-brand-600"
              />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      <SubmitButton>Salvează</SubmitButton>
    </form>
  );
}
