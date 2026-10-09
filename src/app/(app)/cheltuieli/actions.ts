"use server";

import { revalidatePath } from "next/cache";
import { authorize, FORBIDDEN } from "@/lib/auth/guard";
import { dbErrorMessage } from "@/lib/db-errors";
import { monthOf } from "@/lib/month";
import { numeric } from "@/lib/supabase/numeric";
import { fieldErrors, type FormState } from "@/lib/validation/auth";
import { uuidSchema } from "@/lib/validation/common";
import { expenseSchema } from "@/lib/validation/finance";
import type { SaveState } from "../incasari/actions";

export async function addExpense(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const auth = await authorize("records.create");
  if (!auth) return FORBIDDEN;
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const v = parsed.data;

  const { data: category } = await auth.supabase
    .from("expense_categories")
    .select("is_active")
    .eq("business_id", auth.businessId)
    .eq("id", v.category_id)
    .maybeSingle();
  if (!category?.is_active)
    return {
      ok: false,
      message: "Alegeți o categorie activă.",
      fieldErrors: { category_id: ["Alegeți categoria."] },
    };

  const { error } = await auth.supabase.from("expenses").insert({
    business_id: auth.businessId,
    expense_date: v.expense_date,
    category_id: v.category_id,
    description: v.description,
    amount: numeric(v.amount),
    currency: v.currency,
    exchange_rate: numeric(v.exchange_rate),
    supplier: v.supplier,
    client_token: v.client_token,
  });
  const repeat = error?.code === "23505" && /client_token/.test(`${error.message} ${error.details}`);
  if (error && !repeat) return { ok: false, message: dbErrorMessage(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: "Cheltuiala a fost salvată.", month: monthOf(v.expense_date) };
}

export async function deleteExpense(id: string): Promise<FormState> {
  const auth = await authorize("records.delete");
  if (!auth) return FORBIDDEN;
  if (!uuidSchema.safeParse(id).success) return { ok: false, message: "Înregistrare invalidă." };
  const { error } = await auth.supabase
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("business_id", auth.businessId)
    .eq("id", id);
  if (error) return { ok: false, message: dbErrorMessage(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: "Cheltuiala a fost ștearsă." };
}
