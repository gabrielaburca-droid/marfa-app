"use client";

import { useActionState, useState } from "react";
import { Sheet, useSaved } from "@/components/finance/sheet";
import { Field, inputClass } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatRON } from "@/lib/format";
import { normalizeDecimal } from "@/lib/validation/common";
import { addMarketIncome, addSale } from "./actions";

export type ChannelOption = { id: string; name: string; kind: "market" | "online" | "other" };

function Chips({
  name,
  options,
  defaultValue,
  label,
  errors,
}: {
  name: string;
  options: ChannelOption[];
  defaultValue?: string;
  label: string;
  errors?: string[];
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-semibold text-stone-700">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.id} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={o.id}
              defaultChecked={o.id === defaultValue}
              className="peer sr-only"
              required
            />
            <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-700 ring-1 ring-stone-200 transition peer-checked:bg-brand-600 peer-checked:text-white peer-checked:ring-brand-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600">
              {o.name}
            </span>
          </label>
        ))}
      </div>
      {errors?.[0] && <p className="text-sm text-rose-600">{errors[0]}</p>}
    </fieldset>
  );
}

const money = (v: string) => normalizeDecimal(v, { dotGroupsThousands: true });

export function MarketIncomeForm({
  channels,
  date,
  token,
  closeHref,
}: {
  channels: ChannelOption[];
  date: string;
  token: string;
  closeHref: string;
}) {
  const [state, action] = useActionState(addMarketIncome, {});
  useSaved(state, "/incasari");
  const e = state.fieldErrors ?? {};
  const [gross, setGross] = useState("");
  const [cash, setCash] = useState("");
  const total = money(gross);
  const cashN = money(cash);
  const rest = total && cashN ? Number(total) - Number(cashN) : null;

  return (
    <Sheet title="Încasare târg" closeHref={closeHref}>
      <form action={action} className="space-y-5" noValidate>
        <input type="hidden" name="client_token" value={token} />
        <Chips
          name="channel_id"
          label="Unde?"
          options={channels}
          defaultValue={channels[0]?.id}
          errors={e.channel_id}
        />
        <div className="space-y-1.5">
          <label htmlFor="gross_amount" className="block text-sm font-semibold text-stone-700">
            Total încasat în ziua respectivă
          </label>
          <input
            id="gross_amount"
            name="gross_amount"
            inputMode="decimal"
            placeholder="5.000"
            autoComplete="off"
            value={gross}
            onChange={(ev) => setGross(ev.target.value)}
            className={`${inputClass} !py-3.5 !text-2xl font-bold tabular`}
            aria-invalid={Boolean(e.gross_amount)}
            aria-describedby={e.gross_amount ? "gross-error" : undefined}
          />
          {e.gross_amount && (
            <p id="gross-error" className="text-sm text-rose-600">
              {e.gross_amount[0]}
            </p>
          )}
        </div>
        <Field label="Data" name="entry_date" type="date" defaultValue={date} errors={e.entry_date} />
        <details className="rounded-2xl bg-white p-4 ring-1 ring-stone-200" open={Boolean(e.cash_amount)}>
          <summary className="cursor-pointer text-sm font-semibold text-stone-700">
            Numerar și card (opțional)
          </summary>
          <p className="mt-2 text-xs text-stone-500">Sunt o parte din total, nu se adună în plus.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field
              label="Numerar"
              name="cash_amount"
              inputMode="decimal"
              value={cash}
              onChange={(ev) => setCash(ev.target.value)}
              errors={e.cash_amount}
            />
            <Field
              label="Card"
              name="card_amount"
              inputMode="decimal"
              placeholder={rest !== null && rest >= 0 ? String(rest) : ""}
              hint="Gol = restul"
            />
          </div>
        </details>
        <Field label="Notițe (opțional)" name="notes" errors={e.notes} />
        <SubmitButton className="w-full !py-3">Salvează încasarea</SubmitButton>
      </form>
    </Sheet>
  );
}

export function SaleForm({
  channels,
  date,
  token,
  closeHref,
}: {
  channels: ChannelOption[];
  date: string;
  token: string;
  closeHref: string;
}) {
  const [state, action] = useActionState(addSale, {});
  useSaved(state, "/incasari");
  const e = state.fieldErrors ?? {};
  const [v, setV] = useState({ gross: "", commission: "", shipping: "", discount: "" });
  const set = (k: keyof typeof v) => (ev: React.ChangeEvent<HTMLInputElement>) =>
    setV((s) => ({ ...s, [k]: ev.target.value }));
  const n = (s: string) => Number(money(s) ?? 0);
  const gross = money(v.gross);
  const net = gross ? n(v.gross) - n(v.commission) - n(v.shipping) - n(v.discount) : null;
  const vinted = channels.find((c) => /vinted/i.test(c.name))?.id;

  return (
    <Sheet title="Vânzare" closeHref={closeHref}>
      <form action={action} className="space-y-5" noValidate>
        <input type="hidden" name="client_token" value={token} />
        <Chips
          name="channel_id"
          label="Unde ai vândut?"
          options={channels}
          defaultValue={vinted ?? channels[0]?.id}
          errors={e.channel_id}
        />
        <Field label="Ce ai vândut" name="product_name" placeholder="Lot Goebel" errors={e.product_name} />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Preț"
            name="gross_amount"
            inputMode="decimal"
            placeholder="290"
            value={v.gross}
            onChange={set("gross")}
            errors={e.gross_amount}
          />
          <Field label="Data" name="entry_date" type="date" defaultValue={date} errors={e.entry_date} />
        </div>
        <Field label="Client (opțional)" name="buyer" placeholder="Nume sau cont" errors={e.buyer} />
        <details className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <summary className="cursor-pointer text-sm font-semibold text-stone-700">
            Comision, transport, reducere (opțional)
          </summary>
          <p className="mt-2 text-xs text-stone-500">Se scad din preț, ca să rămână ce ai primit de fapt.</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Field
              label="Comision"
              name="commission_amount"
              inputMode="decimal"
              value={v.commission}
              onChange={set("commission")}
              errors={e.commission_amount}
            />
            <Field
              label="Transport"
              name="shipping_amount"
              inputMode="decimal"
              value={v.shipping}
              onChange={set("shipping")}
              errors={e.shipping_amount}
            />
            <Field
              label="Reducere"
              name="discount_amount"
              inputMode="decimal"
              value={v.discount}
              onChange={set("discount")}
              errors={e.discount_amount}
            />
          </div>
          <div className="mt-3">
            <Field label="Nr. comandă (opțional)" name="reference" errors={e.reference} />
          </div>
        </details>
        {net !== null && (
          <p
            className={`rounded-2xl px-4 py-3 text-sm font-semibold ${net >= 0 ? "bg-brand-50 text-brand-800" : "bg-amber-50 text-amber-800"}`}
            aria-live="polite"
          >
            Rămâne: {formatRON(net)}
          </p>
        )}
        <SubmitButton className="w-full !py-3">Salvează vânzarea</SubmitButton>
      </form>
    </Sheet>
  );
}
