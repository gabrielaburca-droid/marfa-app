/**
 * Creates the first business and its administrator.
 * Public sign-up is disabled, so this is how the very first account exists;
 * every other user is invited from Setări → Utilizatori.
 *
 *   node --env-file=.env.local scripts/create-admin.ts \
 *     --business "Firma SRL" --email admin@firma.ro --name "Ion Popescu" --password '...'
 */
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";

const { values } = parseArgs({
  options: {
    business: { type: "string" },
    email: { type: "string" },
    name: { type: "string", default: "" },
    password: { type: "string" },
  },
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");
if (!values.business || !values.email || !values.password) {
  throw new Error("Usage: --business <name> --email <email> --password <min 10 chars> [--name <full name>]");
}
if (values.password.length < 10) throw new Error("Password must have at least 10 characters.");

const admin = createClient(url, secret, { auth: { persistSession: false } });

const { data: created, error: userError } = await admin.auth.admin.createUser({
  email: values.email,
  password: values.password,
  email_confirm: true,
  user_metadata: { full_name: values.name },
});
if (userError) throw userError;

const { data: business, error: bizError } = await admin
  .from("businesses")
  .insert({ name: values.business })
  .select("id")
  .single();
if (bizError) throw bizError;

const { error: memberError } = await admin
  .from("business_memberships")
  .insert({ business_id: business.id, user_id: created.user.id, role: "admin" });
if (memberError) throw memberError;

console.log(`Created business ${business.id} with admin ${values.email}.`);
