"use server";

import { revalidatePath } from "next/cache";
import { authorize, FORBIDDEN } from "@/lib/auth/guard";
import { dbErrorMessage } from "@/lib/db-errors";
import { monthOf } from "@/lib/month";
import { numeric } from "@/lib/supabase/numeric";
import { fieldErrors, type FormState } from "@/lib/validation/auth";
import { uuidSchema } from "@/lib/validation/common";
import { marketIncomeSchema, saleIncomeSchema } from "@/lib/validation/finance";

export type SaveState = FormState & { month?: string };

type PgError = { code?: string; message?: string; details?: string | null };

/** A second submit of the same form (double tap, retry) is not an error. */
const isRepeat = (e: PgError) => e.code === "23505" && /client_token/.test(`${e.message} ${e.details}`);

function done(entryDate: string, message: string): SaveState {
  revalidatePath("/", "layout");
  return { ok: true, message, month: monthOf(entryDate) };
}

async function channelKind(
  supabase: NonNullable<Awaited<ReturnType<typeof authorize>>>["supabase"],
  businessId: string,
  channelId: string,
) {
  const { data } = await supabase
    .from("sales_channels")
    .select("kind, is_active")
    .eq("business_id", businessId)
    .eq("id", channelId)
    .maybeSingle();
  return data?.is_active ? data.kind : null;
}

export async function addMarketIncome(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const auth = await authorize("records.create");
  if (!auth) return FORBIDDEN;
  const parsed = marketIncomeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const v = parsed.data;

  if (!(await channelKind(auth.supabase, auth.businessId, v.channel_id)))
    return {
      ok: false,
      message: "Alegeți un târg sau canal activ.",
      fieldErrors: { channel_id: ["Alegeți locul."] },
    };

  const split = v.cash_amount !== null;
  const { error } = await auth.supabase.from("income_entries").insert({
    business_id: auth.businessId,
    entry_kind: "aggregate",
    entry_date: v.entry_date,
    period_start: v.entry_date,
    period_end: v.entry_date,
    channel_id: v.channel_id,
    gross_amount: numeric(v.gross_amount),
    cash_amount: split ? numeric(v.cash_amount!) : null,
    card_amount: split ? numeric(v.card_amount!) : null,
    payment_method: !split
      ? "cash"
      : Number(v.card_amount) === 0
        ? "cash"
        : Number(v.cash_amount) === 0
          ? "card"
          : "mixed",
    description: "Încasări totale",
    notes: v.notes,
    client_token: v.client_token,
  });
  if (error && !isRepeat(error)) return { ok: false, message: dbErrorMessage(error) };
  return done(v.entry_date, "Încasarea a fost salvată.");
}

export async function addSale(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const auth = await authorize("records.create");
  if (!auth) return FORBIDDEN;
  const parsed = saleIncomeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const v = parsed.data;

  if (!(await channelKind(auth.supabase, auth.businessId, v.channel_id)))
    return {
      ok: false,
      message: "Alegeți un canal activ.",
      fieldErrors: { channel_id: ["Alegeți canalul."] },
    };

  const { error } = await auth.supabase.from("income_entries").insert({
    business_id: auth.businessId,
    entry_kind: "sale",
    entry_date: v.entry_date,
    period_start: v.entry_date,
    period_end: v.entry_date,
    channel_id: v.channel_id,
    product_name: v.product_name,
    description: v.buyer ?? "",
    gross_amount: numeric(v.gross_amount),
    commission_amount: numeric(v.commission_amount),
    shipping_amount: numeric(v.shipping_amount),
    discount_amount: numeric(v.discount_amount),
    reference: v.reference,
    client_token: v.client_token,
  });
  if (error && !isRepeat(error)) return { ok: false, message: dbErrorMessage(error) };
  return done(v.entry_date, "Vânzarea a fost salvată.");
}

/** Soft delete: the record stays in the history and an admin can see it. */
export async function deleteIncome(id: string): Promise<FormState> {
  const auth = await authorize("records.delete");
  if (!auth) return FORBIDDEN;
  if (!uuidSchema.safeParse(id).success) return { ok: false, message: "Înregistrare invalidă." };
  const { error } = await auth.supabase
    .from("income_entries")
    .update({ deleted_at: new Date().toISOString() })
    .eq("business_id", auth.businessId)
    .eq("id", id);
  if (error) return { ok: false, message: dbErrorMessage(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: "Încasarea a fost ștearsă." };
}
