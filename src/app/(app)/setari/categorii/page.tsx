import { Card } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/session";
import { EXPENSE_GROUP_LABELS } from "@/lib/finance/labels";
import { createClient } from "@/lib/supabase/server";
import { EditableList } from "../editable-list";

export const metadata = { title: "Categorii" };

const GROUP_OPTIONS = Object.entries(EXPENSE_GROUP_LABELS).map(([value, label]) => ({ value, label }));

export default async function CategoriesPage() {
  const { membership } = await requirePermission("settings.manage");
  const supabase = await createClient();
  const [income, expense] = await Promise.all([
    supabase
      .from("income_categories")
      .select("id, name, is_active")
      .eq("business_id", membership.businessId)
      .order("sort_order")
      .order("name"),
    supabase
      .from("expense_categories")
      .select("id, name, is_active, report_group")
      .eq("business_id", membership.businessId)
      .order("sort_order")
      .order("name"),
  ]);

  return (
    <div className="space-y-6">
      <Card
        title="Categorii de cheltuieli"
        description="Grupa decide unde apare cheltuiala în Dashboard și în rapoarte. Amenzile sunt mereu raportate separat."
      >
        <EditableList
          table="expense_categories"
          itemLabel="categoria"
          extraFields={[{ kind: "select", name: "report_group", label: "Grupă", options: GROUP_OPTIONS }]}
          items={(expense.data ?? []).map((c) => ({
            ...c,
            values: { report_group: c.report_group },
            detail: EXPENSE_GROUP_LABELS[c.report_group],
          }))}
        />
      </Card>
      <Card title="Tipuri de încasări">
        <EditableList
          table="income_categories"
          itemLabel="tipul"
          items={(income.data ?? []).map((c) => ({ ...c, values: {} }))}
        />
      </Card>
    </div>
  );
}
