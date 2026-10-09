"use client";

import { useActionState, useState } from "react";
import { Sheet, useSaved } from "@/components/finance/sheet";
import { Field, inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { EXPENSE_GROUP_LABELS, type ExpenseGroup } from "@/lib/finance/labels";
import { formatDate, formatRON } from "@/lib/format";
import { toRon } from "@/lib/validation/finance";
import { addExpense } from "./actions";

export type CategoryOption = { id: string; name: string; report_group: ExpenseGroup };
export type SavedRate = { currency: string; rate_date: string; rate_to_ron: number };

/** Latest saved rate on or before the date. Rates arrive newest first. */
function savedRate(rates: SavedRate[], currency: string, date: string) {
  return rates.find((r) => r.currency === currency && r.rate_date <= date) ?? null;
}

export function ExpenseForm({
  categories,
  currencies,
  rates,
  date: initialDate,
  token,
  closeHref,
  fuel,
}: {
  categories: CategoryOption[];
  currencies: string[];
  rates: SavedRate[];
  date: string;
  token: string;
  closeHref: string;
  fuel: boolean;
}) {
  const [state, action] = useActionState(addExpense, {});
  useSaved(state, "/cheltuieli");
  const e = state.fieldErrors ?? {};
  const [currency, setCurrency] = useState("RON");
  const [date, setDate] = useState(initialDate);
  const [amount, setAmount] = useState("");
  const saved = currency === "RON" ? null : savedRate(rates, currency, date);
  const [rate, setRate] = useState<string | null>(null);
  const rateValue = rate ?? (saved ? String(saved.rate_to_ron).replace(".", ",") : "");
  const ron = currency !== "RON" && amount && rateValue ? toRon(amount, rateValue) : null;

  const groups = (Object.keys(EXPENSE_GROUP_LABELS) as ExpenseGroup[])
    .map((g) => [g, categories.filter((c) => c.report_group === g)] as const)
    .filter(([, list]) => list.length);
  const fuelDefault = categories.find((c) => /combustibil/i.test(c.name) && /târg/i.test(c.name))?.id;

  return (
    <Sheet title={fuel ? "Motorină" : "Cheltuială"} closeHref={closeHref}>
      <form action={action} className="space-y-5" noValidate>
        <input type="hidden" name="client_token" value={token} />
        <div className="space-y-1.5">
          <label htmlFor="category_id" className="block text-sm font-medium text-stone-600">
            Categorie
          </label>
          <select
            id="category_id"
            name="category_id"
            className={`${inputClass} pr-8`}
            defaultValue={fuel ? fuelDefault : ""}
            aria-invalid={Boolean(e.category_id)}
          >
            <option value="" disabled>
              Alege…
            </option>
            {groups.map(([g, list]) => (
              <optgroup key={g} label={EXPENSE_GROUP_LABELS[g]}>
                {list.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {e.category_id && <p className="text-sm text-rose-600">{e.category_id[0]}</p>}
        </div>
        <Field
          label="Descriere (opțional)"
          name="description"
          placeholder={fuel ? "Drum Suceava" : "Lot marfă septembrie"}
          errors={e.description}
        />
        <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
          <Field
            label="Sumă"
            name="amount"
            inputMode="decimal"
            placeholder="2.890"
            value={amount}
            onChange={(ev) => setAmount(ev.target.value)}
            errors={e.amount}
          />
          <div className="space-y-1.5">
            <label htmlFor="currency" className="block text-sm font-medium text-stone-600">
              Monedă
            </label>
            <select
              id="currency"
              name="currency"
              className={`${inputClass} pr-8`}
              value={currency}
              onChange={(ev) => {
                setCurrency(ev.target.value);
                setRate(null);
              }}
            >
              {currencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        {currency !== "RON" && (
          <div className="space-y-2">
            <Field
              label={`Curs: lei pentru 1 ${currency}`}
              name="exchange_rate"
              inputMode="decimal"
              placeholder="5,0850"
              value={rateValue}
              onChange={(ev) => setRate(ev.target.value)}
              errors={e.exchange_rate}
              hint={
                saved && rate === null
                  ? `Cursul salvat din ${formatDate(saved.rate_date)}. Îl poți schimba.`
                  : "Scrie cursul BNR din ziua plății."
              }
            />
            {ron && (
              <p
                className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-700"
                aria-live="polite"
              >
                În lei: {formatRON(ron)}
              </p>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Data"
            name="expense_date"
            type="date"
            value={date}
            onChange={(ev) => setDate(ev.target.value)}
            errors={e.expense_date}
          />
          <Field label="Furnizor (opțional)" name="supplier" errors={e.supplier} />
        </div>
        <SubmitButton className="w-full !py-3">Salvează cheltuiala</SubmitButton>
      </form>
    </Sheet>
  );
}
