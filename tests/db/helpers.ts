import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishable = () => process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export function serviceClient(): SupabaseClient {
  return createClient(url(), process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
}

export function anonClient(): SupabaseClient {
  return createClient(url(), publishable(), { auth: { persistSession: false } });
}

export const PASSWORD = "Parola-de-test-123";

export type TestUser = { id: string; email: string; client: SupabaseClient };

/** Creates a confirmed user through the Admin API and signs them in. */
export async function createUser(label: string, fullName = label): Promise<TestUser> {
  const email = `${label}-${randomUUID().slice(0, 8)}@test.local`;
  const { data, error } = await serviceClient().auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw error;
  const client = anonClient();
  const signIn = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signIn.error) throw signIn.error;
  return { id: data.user.id, email, client };
}

export async function createBusiness(name: string): Promise<string> {
  const { data, error } = await serviceClient()
    .from("businesses")
    .insert({ name: `${name} ${randomUUID().slice(0, 6)}` })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function addMember(
  businessId: string,
  userId: string,
  role: "admin" | "operator",
  canViewReports = false,
) {
  const { error } = await serviceClient()
    .from("business_memberships")
    .insert({ business_id: businessId, user_id: userId, role, can_view_reports: canViewReports });
  if (error) throw error;
}

export async function channelId(businessId: string, name: string): Promise<string> {
  const { data, error } = await serviceClient()
    .from("sales_channels")
    .select("id")
    .eq("business_id", businessId)
    .eq("name", name)
    .single();
  if (error) throw error;
  return data.id;
}

export async function expenseCategoryId(businessId: string, name: string): Promise<string> {
  const { data, error } = await serviceClient()
    .from("expense_categories")
    .select("id")
    .eq("business_id", businessId)
    .eq("name", name)
    .single();
  if (error) throw error;
  return data.id;
}
