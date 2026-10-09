/**
 * Imports income and expenses from a CSV (for example a notebook page copied
 * by hand) into one business. Shows what it would do; writes only with --apply.
 * Running it twice does not duplicate rows: each row gets a stable token.
 *
 *   node --env-file=.env.local scripts/import-csv.ts --file caiet.csv --email admin@firma.ro [--apply]
 *
 * Columns: tip (intrare|cheltuiala), data (YYYY-MM-DD), canal_sau_categorie
 * (channel name for income, category name for expenses), descriere, client,
 * suma, moneda, curs (lei per unit, foreign currency only), observatii.
 * Income on a market channel becomes a day total; anything else is one sale.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";

const { values } = parseArgs({
  options: {
    file: { type: "string" },
    email: { type: "string" },
    apply: { type: "boolean", default: false },
  },
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");
if (!values.file || !values.email) throw new Error("Usage: --file <csv> --email <admin email> [--apply]");

function parseCsv(text: string): Record<string, string>[] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim())) lines.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) lines.push(row);
  const [header, ...body] = lines;
  return body.map((r) =>
    Object.fromEntries(header.map((h, i) => [h.trim().replace(/^﻿/, ""), (r[i] ?? "").trim()])),
  );
}

/** A UUID derived from the row, so a second import of the same file is a no-op. */
function token(businessId: string, line: number, row: Record<string, string>) {
  const h = createHash("sha256")
    .update(`${businessId}|${line}|${JSON.stringify(row)}`)
    .digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const money = (s: string) => {
  const v = s.replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(v)) throw new Error(`Sumă invalidă: "${s}"`);
  return v;
};

const db = createClient(url, secret, { auth: { persistSession: false } });

const { data: profile, error: pErr } = await db
  .from("profiles")
  .select("id")
  .eq("email", values.email)
  .single();
if (pErr) throw new Error(`Nu găsesc utilizatorul ${values.email}`);
const { data: member, error: mErr } = await db
  .from("business_memberships")
  .select("business_id, businesses(name)")
  .eq("user_id", profile.id)
  .eq("role", "admin")
  .eq("is_active", true)
  .limit(1)
  .single();
if (mErr) throw new Error(`${values.email} nu este administrator activ.`);
const businessId = member.business_id;

const [{ data: channels }, { data: categories }] = await Promise.all([
  db.from("sales_channels").select("id, name, kind").eq("business_id", businessId),
  db.from("expense_categories").select("id, name").eq("business_id", businessId),
]);
const find = <T extends { name: string }>(list: T[] | null, name: string) =>
  list?.find((x) => x.name.toLowerCase() === name.toLowerCase());

const rows = parseCsv(readFileSync(values.file, "utf8"));
const income: Record<string, unknown>[] = [];
const expenses: Record<string, unknown>[] = [];

rows.forEach((r, i) => {
  const line = i + 2;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.data)) throw new Error(`Rândul ${line}: data trebuie să fie YYYY-MM-DD.`);
  const currency = (r.moneda || "RON").toUpperCase();
  const rate = currency === "RON" ? "1" : money(r.curs);
  const base = { business_id: businessId, created_by: profile.id, client_token: token(businessId, line, r) };
  if (r.tip === "intrare") {
    const ch = find(channels, r.canal_sau_categorie);
    if (!ch) throw new Error(`Rândul ${line}: canalul "${r.canal_sau_categorie}" nu există.`);
    const market = ch.kind === "market";
    income.push({
      ...base,
      entry_kind: market ? "aggregate" : "sale",
      entry_date: r.data,
      period_start: r.data,
      period_end: r.data,
      channel_id: ch.id,
      currency,
      exchange_rate: rate,
      gross_amount: money(r.suma),
      product_name: market ? null : r.descriere || "Vânzare",
      description: market ? "Încasări totale" : r.client,
      notes: r.observatii || null,
    });
  } else if (r.tip === "cheltuiala") {
    const cat = find(categories, r.canal_sau_categorie);
    if (!cat) throw new Error(`Rândul ${line}: categoria "${r.canal_sau_categorie}" nu există.`);
    expenses.push({
      ...base,
      expense_date: r.data,
      category_id: cat.id,
      description: r.descriere,
      supplier: r.client || null,
      currency,
      exchange_rate: rate,
      amount: money(r.suma),
      notes: r.observatii || null,
    });
  } else throw new Error(`Rândul ${line}: tip necunoscut "${r.tip}".`);
});

const business = (member.businesses as unknown as { name: string } | null)?.name;
console.log(`Firma: ${business}. ${income.length} intrări, ${expenses.length} cheltuieli.`);
if (!values.apply) {
  console.log("Nimic scris. Rulați din nou cu --apply pentru a importa.");
  process.exit(0);
}

for (const [table, list] of [
  ["income_entries", income],
  ["expenses", expenses],
] as const) {
  if (!list.length) continue;
  // The token index is partial, which upsert can't target, so skip known tokens first.
  const { data: known, error: kErr } = await db
    .from(table)
    .select("client_token")
    .eq("business_id", businessId)
    .in(
      "client_token",
      list.map((r) => r.client_token as string),
    );
  if (kErr) throw new Error(`${table}: ${kErr.message}`);
  const seen = new Set(known.map((k) => k.client_token));
  const fresh = list.filter((r) => !seen.has(r.client_token as string));
  const { data, error } = fresh.length
    ? await db.from(table).insert(fresh).select("id")
    : { data: [], error: null };
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`${table}: ${data.length} rânduri noi (${list.length - data.length} existau deja).`);
}
