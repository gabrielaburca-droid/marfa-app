import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { can, type Membership, type Permission, type Role } from "./permissions";

export const ACTIVE_BUSINESS_COOKIE = "marfa_business";

export type SessionContext = {
  user: { id: string; email: string; fullName: string };
  membership: Membership;
  memberships: Membership[];
};

type MembershipRow = {
  business_id: string;
  role: Role;
  can_view_reports: boolean;
  businesses: { name: string } | null;
};

/**
 * Resolves the signed-in user and their active business membership on the
 * server. The business is never taken from the client without checking
 * that the user is an active member of it.
 */
export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
    supabase
      .from("business_memberships")
      .select("business_id, role, can_view_reports, businesses(name)")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .returns<MembershipRow[]>(),
  ]);

  const memberships: Membership[] = (rows ?? []).map((r) => ({
    businessId: r.business_id,
    businessName: r.businesses?.name ?? "",
    role: r.role,
    canViewReports: r.can_view_reports,
  }));
  if (memberships.length === 0) return null;

  const preferred = (await cookies()).get(ACTIVE_BUSINESS_COOKIE)?.value;
  const membership = memberships.find((m) => m.businessId === preferred) ?? memberships[0];

  return {
    user: {
      id: user.id,
      email: profile?.email ?? user.email ?? "",
      fullName: profile?.full_name ?? "",
    },
    membership,
    memberships,
  };
});

/** For pages and server actions: signed in with an active membership, or out. */
export async function requireSession(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    redirect(data.user ? "/auth/no-access" : "/login");
  }
  return ctx;
}

export async function requirePermission(p: Permission): Promise<SessionContext> {
  const ctx = await requireSession();
  if (!can(ctx.membership, p)) redirect("/?eroare=acces");
  return ctx;
}
