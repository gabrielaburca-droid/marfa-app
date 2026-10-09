"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize, FORBIDDEN } from "@/lib/auth/guard";
import { dbErrorMessage } from "@/lib/db-errors";
import { fieldErrors, type FormState } from "@/lib/validation/auth";
import { nameSchema, optionalText, optionalUuid } from "@/lib/validation/common";

const TABLES = ["income_categories", "expense_categories", "market_locations", "sales_channels"] as const;
export type SettingsTable = (typeof TABLES)[number];

const PATHS: Record<SettingsTable, string> = {
  income_categories: "/setari/categorii",
  expense_categories: "/setari/categorii",
  market_locations: "/setari/canale",
  sales_channels: "/setari/canale",
};

const tableSchema = z.enum(TABLES);

const SCHEMAS = {
  income_categories: z.object({ name: nameSchema }),
  expense_categories: z.object({
    name: nameSchema,
    report_group: z.enum(["merchandise", "transport_import", "market", "operating", "fines"], {
      error: "Alegeți grupa.",
    }),
  }),
  market_locations: z.object({ name: nameSchema, city: optionalText(100) }),
  sales_channels: z.object({
    name: nameSchema,
    kind: z.enum(["market", "online", "other"], { error: "Alegeți tipul canalului." }),
    market_location_id: optionalUuid,
  }),
} satisfies Record<SettingsTable, z.ZodType>;

export async function saveSettingsItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("settings.manage");
  if (!auth) return FORBIDDEN;

  const table = tableSchema.safeParse(formData.get("table"));
  if (!table.success) return { ok: false, message: "Cerere invalidă." };
  const parsed = SCHEMAS[table.data].safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);

  const id = formData.get("id");
  const values = parsed.data as Record<string, string | null>;
  if (table.data === "sales_channels" && values.kind !== "market") values.market_location_id = null;

  let error;
  if (typeof id === "string" && id) {
    ({ error } = await auth.supabase
      .from(table.data)
      .update(values as never)
      .eq("id", id)
      .eq("business_id", auth.businessId));
  } else {
    const { data: last } = await auth.supabase
      .from(table.data)
      .select("sort_order")
      .eq("business_id", auth.businessId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    ({ error } = await auth.supabase
      .from(table.data)
      .insert({ ...values, business_id: auth.businessId, sort_order: (last?.sort_order ?? 0) + 1 } as never));
  }
  if (error) {
    return {
      ok: false,
      message: error.code === "23505" ? "Există deja un element cu acest nume." : dbErrorMessage(error),
    };
  }
  revalidatePath(PATHS[table.data]);
  return { ok: true, message: id ? "Modificarea a fost salvată." : "Elementul a fost adăugat." };
}

export async function setSettingsItemActive(
  table: SettingsTable,
  id: string,
  active: boolean,
): Promise<FormState> {
  const auth = await authorize("settings.manage");
  if (!auth || !tableSchema.safeParse(table).success) return FORBIDDEN;
  const { error } = await auth.supabase
    .from(table)
    .update({ is_active: active })
    .eq("id", id)
    .eq("business_id", auth.businessId);
  if (error) return { ok: false, message: dbErrorMessage(error) };
  revalidatePath(PATHS[table]);
  return { ok: true, message: active ? "Elementul a fost reactivat." : "Elementul a fost dezactivat." };
}

/** Moves an item one place up or down and renumbers the list. */
export async function moveSettingsItem(
  table: SettingsTable,
  id: string,
  direction: "up" | "down",
): Promise<FormState> {
  const auth = await authorize("settings.manage");
  if (!auth || !tableSchema.safeParse(table).success) return FORBIDDEN;

  const { data: rows, error } = await auth.supabase
    .from(table)
    .select("id, sort_order")
    .eq("business_id", auth.businessId)
    .order("sort_order")
    .order("name");
  if (error || !rows) return { ok: false, message: dbErrorMessage(error) };

  const ids = rows.map((r) => r.id);
  const from = ids.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= ids.length) return { ok: true };
  [ids[from], ids[to]] = [ids[to], ids[from]];

  const changed = ids
    .map((rowId, index) => ({ id: rowId, sort_order: index + 1 }))
    .filter((r) => rows.find((x) => x.id === r.id)!.sort_order !== r.sort_order);
  for (const r of changed) {
    const { error: updateError } = await auth.supabase
      .from(table)
      .update({ sort_order: r.sort_order })
      .eq("id", r.id)
      .eq("business_id", auth.businessId);
    if (updateError) return { ok: false, message: dbErrorMessage(updateError) };
  }
  revalidatePath(PATHS[table]);
  return { ok: true };
}
