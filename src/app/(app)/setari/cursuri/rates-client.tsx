"use client";

import { useActionState, useRef, useTransition } from "react";
import { Badge, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { useActionToast, useToast } from "@/components/ui/toast";
import { formatDate, formatNumber } from "@/lib/format";
import { deleteRate, importBnrRates, saveRate } from "./actions";

type Rate = { id: string; currency: string; rate_date: string; rate_to_ron: number; source: string };

export function RateForm({ currencies, today }: { currencies: string[]; today: string }) {
  const [state, action] = useActionState(saveRate, {});
  const ref = useRef<HTMLFormElement>(null);
  useActionToast(state, () => ref.current?.reset());
  const e = state.fieldErrors ?? {};
  return (
    <form
      ref={ref}
      action={action}
      className="grid gap-3 sm:grid-cols-[8rem_10rem_1fr_auto] sm:items-end"
      noValidate
    >
      <SelectField label="Valută" name="currency" errors={e.currency}>
        {currencies.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </SelectField>
      <Field label="Data" name="rate_date" type="date" defaultValue={today} errors={e.rate_date} />
      <Field
        label="Lei pentru 1 unitate"
        name="rate_to_ron"
        inputMode="decimal"
        placeholder="4,9767"
        errors={e.rate_to_ron}
      />
      <SubmitButton>Salvează cursul</SubmitButton>
    </form>
  );
}

export function BnrButton() {
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await importBnrRates();
          if (r.message) toast({ tone: r.ok ? "success" : "error", message: r.message });
        })
      }
    >
      {pending ? "Se preia…" : "Preia cursul BNR de azi"}
    </Button>
  );
}

export function RatesTable({ rates }: { rates: Rate[] }) {
  const toast = useToast();
  if (rates.length === 0)
    return (
      <EmptyState title="Nu ați salvat niciun curs.">
        Adăugați unul mai sus sau preluați cursul BNR.
      </EmptyState>
    );
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead className="border-b border-stone-200 text-left text-[11px] font-bold tracking-wider text-stone-500 uppercase">
          <tr>
            <th className="px-4 py-2">Data</th>
            <th className="px-4 py-2">Valută</th>
            <th className="px-4 py-2 text-right">Lei / unitate</th>
            <th className="px-4 py-2">Sursă</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rates.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2 tabular">{formatDate(r.rate_date)}</td>
              <td className="px-4 py-2 font-medium">{r.currency}</td>
              <td className="px-4 py-2 text-right tabular">{formatNumber(r.rate_to_ron)}</td>
              <td className="px-4 py-2">
                {r.source === "bnr" ? <Badge tone="green">BNR</Badge> : <Badge>Manual</Badge>}
              </td>
              <td className="px-4 py-2 text-right">
                <ConfirmButton
                  label="Șterge"
                  title={`Ștergeți cursul ${r.currency} din ${formatDate(r.rate_date)}?`}
                  description="Înregistrările deja salvate își păstrează cursul. Cursul nu va mai fi propus în formulare."
                  confirmLabel="Șterge"
                  onConfirm={async () => {
                    const res = await deleteRate(r.id);
                    if (res.message) toast({ tone: res.ok ? "success" : "error", message: res.message });
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
