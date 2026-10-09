"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize, FORBIDDEN } from "@/lib/auth/guard";
import { fetchBnrRates } from "@/lib/bnr";
import { dbErrorMessage } from "@/lib/db-errors";
import { numeric } from "@/lib/supabase/numeric";
import { fieldErrors, type FormState } from "@/lib/validation/auth";
import { currencySchema, dateSchema, decimalSchema } from "@/lib/validation/common";

const rateSchema = z.object({
  currency: currencySchema.refine((c) => c !== "RON", "Alegeți o valută."),
  rate_date: dateSchema,
  rate_to_ron: decimalSchema({ scale: 6, min: "positive", label: "cursul" }),
});

export async function saveRate(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("settings.manage");
  if (!auth) return FORBIDDEN;
  const parsed = rateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const { error } = await auth.supabase.from("exchange_rates").upsert(
    {
      ...parsed.data,
      rate_to_ron: numeric(parsed.data.rate_to_ron),
      business_id: auth.businessId,
      source: "manual",
    },
    { onConflict: "business_id,currency,rate_date" },
  );
  if (error) return { ok: false, message: dbErrorMessage(error) };
  revalidatePath("/setari/cursuri");
  return { ok: true, message: `Cursul ${parsed.data.currency} a fost salvat.` };
}

export async function deleteRate(id: string): Promise<FormState> {
  const auth = await authorize("settings.manage");
  if (!auth) return FORBIDDEN;
  const { error } = await auth.supabase
    .from("exchange_rates")
    .delete()
    .eq("id", id)
    .eq("business_id", auth.businessId);
  if (error) return { ok: false, message: dbErrorMessage(error) };
  revalidatePath("/setari/cursuri");
  return { ok: true, message: "Cursul a fost șters." };
}

/** Saves today's BNR rates for the currencies the business uses. */
export async function importBnrRates(): Promise<FormState> {
  const auth = await authorize("settings.manage");
  if (!auth) return FORBIDDEN;

  const { data: business } = await auth.supabase
    .from("businesses")
    .select("enabled_currencies")
    .eq("id", auth.businessId)
    .single();
  const wanted = (business?.enabled_currencies ?? []).filter((c) => c !== "RON");
  if (wanted.length === 0) return { ok: false, message: "Nu ați ales nicio valută în Setări → Firmă." };

  let bnr;
  try {
    bnr = await fetchBnrRates();
  } catch {
    return { ok: false, message: "Cursul BNR nu a putut fi preluat acum. Introduceți-l manual." };
  }

  const rows = wanted
    .filter((c) => bnr.rates[c])
    .map((currency) => ({
      business_id: auth.businessId,
      currency,
      rate_date: bnr.date,
      rate_to_ron: numeric(bnr.rates[currency]),
      source: "bnr",
    }));
  const { error } = await auth.supabase
    .from("exchange_rates")
    .upsert(rows, { onConflict: "business_id,currency,rate_date" });
  if (error) return { ok: false, message: dbErrorMessage(error) };
  revalidatePath("/setari/cursuri");
  return {
    ok: true,
    message: `Cursurile BNR din ${bnr.date.split("-").reverse().join(".")} au fost salvate (${rows.length}).`,
  };
}
