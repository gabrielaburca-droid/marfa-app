import { Card } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { BusinessForm } from "./business-form";

export const metadata = { title: "Setări" };

export default async function BusinessSettingsPage() {
  const { membership } = await requirePermission("settings.manage");
  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, legal_name, tax_id, registration_number, address, enabled_currencies")
    .eq("id", membership.businessId)
    .single();

  return (
    <Card title="Date firmă" description="Apar în antetul aplicației și în rapoarte.">
      {business && <BusinessForm business={business} />}
    </Card>
  );
}
