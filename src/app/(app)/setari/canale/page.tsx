import { Card } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/session";
import { CHANNEL_KIND_LABELS } from "@/lib/finance/labels";
import { createClient } from "@/lib/supabase/server";
import { EditableList } from "../editable-list";

export const metadata = { title: "Canale și locații" };

export default async function ChannelsPage() {
  const { membership } = await requirePermission("settings.manage");
  const supabase = await createClient();
  const [channels, locations] = await Promise.all([
    supabase
      .from("sales_channels")
      .select("id, name, is_active, kind, market_location_id")
      .eq("business_id", membership.businessId)
      .order("sort_order")
      .order("name"),
    supabase
      .from("market_locations")
      .select("id, name, is_active, city")
      .eq("business_id", membership.businessId)
      .order("sort_order")
      .order("name"),
  ]);
  const locationList = locations.data ?? [];
  const locationName = new Map(locationList.map((l) => [l.id, l.name]));

  return (
    <div className="space-y-6">
      <Card
        title="Canale de vânzare"
        description="Fiecare încasare aparține unui canal. Canalele de tip târg sunt legate de o locație."
      >
        <EditableList
          table="sales_channels"
          itemLabel="canalul"
          extraFields={[
            {
              kind: "select",
              name: "kind",
              label: "Tip",
              options: Object.entries(CHANNEL_KIND_LABELS).map(([value, label]) => ({ value, label })),
            },
            {
              kind: "select",
              name: "market_location_id",
              label: "Locație (pentru târg)",
              emptyLabel: "—",
              options: locationList.filter((l) => l.is_active).map((l) => ({ value: l.id, label: l.name })),
            },
          ]}
          items={(channels.data ?? []).map((c) => ({
            id: c.id,
            name: c.name,
            is_active: c.is_active,
            values: { kind: c.kind, market_location_id: c.market_location_id },
            detail: [
              CHANNEL_KIND_LABELS[c.kind],
              c.market_location_id ? locationName.get(c.market_location_id) : null,
            ]
              .filter(Boolean)
              .join(" · "),
          }))}
        />
      </Card>
      <Card title="Locații târguri">
        <EditableList
          table="market_locations"
          itemLabel="locația"
          extraFields={[{ kind: "text", name: "city", label: "Oraș" }]}
          items={locationList.map((l) => ({
            id: l.id,
            name: l.name,
            is_active: l.is_active,
            values: { city: l.city },
            detail: l.city,
          }))}
        />
      </Card>
    </div>
  );
}
