"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize, FORBIDDEN } from "@/lib/auth/guard";
import { COMMON_CURRENCIES } from "@/lib/currencies";
import { dbErrorMessage } from "@/lib/db-errors";
import { fieldErrors, type FormState } from "@/lib/validation/auth";
import { nameSchema, optionalText } from "@/lib/validation/common";

const businessSchema = z.object({
  name: nameSchema,
  legal_name: optionalText(200),
  tax_id: optionalText(20),
  registration_number: optionalText(40),
  address: optionalText(300),
  currencies: z.array(z.enum(COMMON_CURRENCIES, { error: "Monedă necunoscută." })),
});

export async function updateBusiness(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("settings.manage");
  if (!auth) return FORBIDDEN;

  const parsed = businessSchema.safeParse({
    ...Object.fromEntries(formData),
    currencies: formData.getAll("currencies"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);
  const { currencies, ...fields } = parsed.data;

  const { error } = await auth.supabase
    .from("businesses")
    .update({ ...fields, enabled_currencies: ["RON", ...currencies] })
    .eq("id", auth.businessId);
  if (error) return { ok: false, message: dbErrorMessage(error) };

  revalidatePath("/", "layout");
  return { ok: true, message: "Datele firmei au fost salvate." };
}
