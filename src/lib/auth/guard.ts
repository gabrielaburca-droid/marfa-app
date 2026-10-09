import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/validation/auth";
import { can, type Permission } from "./permissions";
import { getSessionContext, type SessionContext } from "./session";

export const FORBIDDEN: FormState = { ok: false, message: "Nu aveți drepturi pentru această operație." };

/**
 * For server actions: re-checks the session and permission on every call.
 * The business id always comes from the verified membership, never the form.
 */
export async function authorize(permission: Permission) {
  const ctx: SessionContext | null = await getSessionContext();
  if (!ctx || !can(ctx.membership, permission)) return null;
  return { ctx, businessId: ctx.membership.businessId, supabase: await createClient() };
}
