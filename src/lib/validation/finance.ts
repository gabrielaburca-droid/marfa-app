import { z } from "zod";
import {
  currencySchema,
  dateSchema,
  decimalSchema,
  normalizeDecimal,
  optionalText,
  uuidSchema,
} from "./common";

const money = (label: string, min: "zero" | "positive" = "zero") =>
  decimalSchema({ scale: 2, min, label, dotGroupsThousands: true });

/** An optional money field: empty means 0. */
const optionalMoney = (label: string) =>
  z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v : "0"))
    .pipe(money(label));

/** An optional money field where empty means "not given" (null). */
const nullableMoney = (label: string) =>
  z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v : undefined))
    .pipe(money(label).optional())
    .transform((v) => v ?? null);

const clientToken = z.uuid({ error: "Formular invalid, reîncărcați pagina." });

/** "1234.5" + "10" in cents, exactly, for cross-field checks. */
function cents(decimal: string): bigint {
  const [i, f = ""] = decimal.split(".");
  return BigInt(i) * 100n + BigInt((f + "00").slice(0, 2));
}

/** Total of one market day (or any channel day): one entry, optional cash/card split. */
export const marketIncomeSchema = z
  .object({
    channel_id: uuidSchema,
    entry_date: dateSchema,
    gross_amount: money("totalul", "positive"),
    cash_amount: nullableMoney("suma în numerar"),
    card_amount: nullableMoney("suma pe card"),
    notes: optionalText(2000),
    client_token: clientToken,
  })
  .superRefine((v, ctx) => {
    if (v.cash_amount === null && v.card_amount === null) return;
    const split = cents(v.cash_amount ?? "0") + cents(v.card_amount ?? "0");
    const bothGiven = v.cash_amount !== null && v.card_amount !== null;
    if (bothGiven ? split !== cents(v.gross_amount) : split > cents(v.gross_amount)) {
      ctx.addIssue({
        code: "custom",
        path: ["cash_amount"],
        message: "Numerarul și cardul adunate trebuie să dea totalul. Sunt o parte din total, nu în plus.",
      });
    }
  })
  .transform((v) => {
    // A split with one side empty means the other side is the rest.
    if (v.cash_amount === null && v.card_amount === null) return v;
    const total = cents(v.gross_amount);
    const cash = v.cash_amount ?? fromCents(total - cents(v.card_amount ?? "0"));
    const card = v.card_amount ?? fromCents(total - cents(cash));
    return { ...v, cash_amount: cash, card_amount: card };
  });

function fromCents(c: bigint): string {
  const s = c.toString().padStart(3, "0");
  return `${s.slice(0, -2)}.${s.slice(-2)}`;
}

/** One sale (online or to a direct customer). */
export const saleIncomeSchema = z
  .object({
    channel_id: uuidSchema,
    entry_date: dateSchema,
    product_name: z
      .string({ error: "Scrieți ce s-a vândut." })
      .trim()
      .min(1, "Scrieți ce s-a vândut.")
      .max(200, "Textul poate avea cel mult 200 de caractere."),
    buyer: optionalText(200),
    gross_amount: money("prețul", "positive"),
    commission_amount: optionalMoney("comisionul"),
    shipping_amount: optionalMoney("transportul"),
    discount_amount: optionalMoney("reducerea"),
    reference: optionalText(100),
    client_token: clientToken,
  })
  .superRefine((v, ctx) => {
    const deductions = cents(v.commission_amount) + cents(v.shipping_amount) + cents(v.discount_amount);
    if (deductions > cents(v.gross_amount)) {
      ctx.addIssue({
        code: "custom",
        path: ["gross_amount"],
        message: "Comisionul, transportul și reducerea depășesc prețul.",
      });
    }
  });

export const expenseSchema = z
  .object({
    expense_date: dateSchema,
    category_id: uuidSchema,
    description: optionalText(500).transform((v) => v ?? ""),
    amount: money("suma", "positive"),
    currency: currencySchema,
    exchange_rate: z.string().optional(),
    supplier: optionalText(200),
    client_token: clientToken,
  })
  .transform((v, ctx) => {
    if (v.currency === "RON") return { ...v, exchange_rate: "1" };
    const rate = normalizeDecimal(v.exchange_rate ?? "");
    if (!rate || /^0(\.0+)?$/.test(rate) || (rate.split(".")[1] ?? "").length > 6) {
      ctx.addIssue({
        code: "custom",
        path: ["exchange_rate"],
        message: `Scrieți cursul ${v.currency} în lei (ex. 5,0850).`,
      });
      return z.NEVER;
    }
    return { ...v, exchange_rate: rate };
  });

/** RON value of amount × rate, rounded half up to bani, as Postgres does it. */
export function toRon(amount: string, rate: string): string | null {
  const a = normalizeDecimal(amount, { dotGroupsThousands: true });
  const r = normalizeDecimal(rate);
  if (!a || !r) return null;
  const [ai, af = ""] = a.split(".");
  const [ri, rf = ""] = r.split(".");
  if (af.length > 2 || rf.length > 6) return null;
  const aUnits = BigInt(ai) * 100n + BigInt((af + "00").slice(0, 2));
  const rUnits = BigInt(ri) * 1_000_000n + BigInt((rf + "000000").slice(0, 6));
  return fromCents((aUnits * rUnits + 500_000n) / 1_000_000n);
}
