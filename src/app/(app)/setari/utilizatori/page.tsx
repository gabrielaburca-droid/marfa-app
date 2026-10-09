import { Card } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { InviteForm, MembersTable, type Member } from "./members-client";

export const metadata = { title: "Utilizatori" };

export default async function UsersPage() {
  const { membership, user } = await requirePermission("users.manage");
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_memberships")
    .select(
      "id, user_id, role, can_view_reports, is_active, created_at, profiles!business_memberships_user_id_fkey(full_name, email)",
    )
    .eq("business_id", membership.businessId)
    .order("is_active", { ascending: false })
    .order("created_at");

  // Whether each person has set a password yet (Auth data, read on the server only).
  const admin = createAdminClient();
  const signedIn = new Map<string, boolean>();
  await Promise.all(
    (data ?? []).map(async (m) => {
      const { data: u } = await admin.auth.admin.getUserById(m.user_id);
      signedIn.set(m.user_id, Boolean(u.user?.last_sign_in_at));
    }),
  );

  const members: Member[] = (data ?? []).map((m) => ({
    id: m.id,
    name: m.profiles?.full_name ?? "",
    email: m.profiles?.email ?? "",
    role: m.role,
    canViewReports: m.can_view_reports,
    isActive: m.is_active,
    hasSignedIn: signedIn.get(m.user_id) ?? false,
    isSelf: m.user_id === user.id,
  }));

  return (
    <div className="space-y-6">
      <Card
        title="Adaugă un utilizator"
        description="Persoana primește un email pentru a-și seta parola. Nu există înregistrare publică."
      >
        <InviteForm />
      </Card>
      <Card title="Utilizatori">
        <MembersTable members={members} />
      </Card>
    </div>
  );
}
