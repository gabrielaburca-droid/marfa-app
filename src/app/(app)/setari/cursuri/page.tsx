import { Card } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/session";
import { todayRO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { BnrButton, RateForm, RatesTable } from "./rates-client";

export const metadata = { title: "Cursuri valutare" };

export default async function RatesPage() {
  const { membership } = await requirePermission("settings.manage");
  const supabase = await createClient();
  const [{ data: business }, { data: rates }] = await Promise.all([
    supabase.from("businesses").select("enabled_currencies").eq("id", membership.businessId).single(),
    supabase
      .from("exchange_rates")
      .select("id, currency, rate_date, rate_to_ron, source")
      .eq("business_id", membership.businessId)
      .order("rate_date", { ascending: false })
      .order("currency")
      .limit(100),
  ]);
  const currencies = (business?.enabled_currencies ?? []).filter((c) => c !== "RON");

  return (
    <Card
      title="Cursuri valutare"
      description="Cursul salvat pentru o zi este propus automat în formulare. Fiecare încasare sau cheltuială își păstrează cursul folosit."
      actions={<BnrButton />}
    >
      <div className="space-y-6">
        {currencies.length > 0 ? (
          <RateForm currencies={currencies} today={todayRO()} />
        ) : (
          <p className="text-sm text-stone-500">Alegeți întâi valutele folosite în Setări → Firmă.</p>
        )}
        <RatesTable rates={rates ?? []} />
      </div>
    </Card>
  );
}
