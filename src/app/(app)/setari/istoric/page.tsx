import Link from "next/link";
import { Card, EmptyState } from "@/components/ui/card";
import { ACTION_LABELS, ENTITY_LABELS, summarizeChanges } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Istoric modificări" };

const PAGE_SIZE = 50;

export default async function AuditPage({ searchParams }: PageProps<"/setari/istoric">) {
  const { membership } = await requirePermission("audit.view");
  const params = await searchParams;
  const page = Math.max(1, Number(params.pagina) || 1);
  const entity = typeof params.tip === "string" && params.tip in ENTITY_LABELS ? params.tip : undefined;

  const supabase = await createClient();
  let query = supabase
    .from("audit_logs")
    .select("id, created_at, actor_id, action, entity_type, changes", { count: "exact" })
    .eq("business_id", membership.businessId)
    .order("id", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (entity) query = query.eq("entity_type", entity);
  const { data: logs, count } = await query;

  const actorIds = [
    ...new Set((logs ?? []).map((l) => l.actor_id).filter((id): id is string => Boolean(id))),
  ];
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", actorIds)
    : { data: [] };
  const actorName = new Map((actors ?? []).map((a) => [a.id, a.full_name || a.email]));
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (p: number) =>
    `/setari/istoric?${new URLSearchParams({ ...(entity ? { tip: entity } : {}), pagina: String(p) })}`;

  return (
    <Card
      title="Istoric modificări"
      description="Fiecare adăugare, modificare și ștergere, cu autorul și ora. Istoricul nu poate fi modificat."
      actions={
        <form className="flex items-center gap-2">
          <label htmlFor="tip" className="sr-only">
            Tip înregistrare
          </label>
          <select
            id="tip"
            name="tip"
            defaultValue={entity ?? ""}
            className="rounded-lg border-0 bg-white py-1.5 pr-8 pl-2 text-sm ring-1 ring-slate-300"
          >
            <option value="">Toate</option>
            {Object.entries(ENTITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button type="submit" className="text-sm font-medium text-brand-700">
            Filtrează
          </button>
        </form>
      }
    >
      {!logs?.length ? (
        <EmptyState title="Nu există modificări înregistrate." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Data și ora</th>
                  <th className="px-4 py-2">Cine</th>
                  <th className="px-4 py-2">Acțiune</th>
                  <th className="px-4 py-2">Ce</th>
                  <th className="px-4 py-2">Detalii</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((l) => (
                  <tr key={l.id} className="align-top">
                    <td className="px-4 py-2 whitespace-nowrap tabular">{formatDateTime(l.created_at)}</td>
                    <td className="px-4 py-2">
                      {l.actor_id ? (actorName.get(l.actor_id) ?? "Utilizator") : "Sistem"}
                    </td>
                    <td className="px-4 py-2">{ACTION_LABELS[l.action] ?? l.action}</td>
                    <td className="px-4 py-2">{ENTITY_LABELS[l.entity_type] ?? l.entity_type}</td>
                    <td className="max-w-md px-4 py-2 text-slate-600">
                      {summarizeChanges(l.action, l.changes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Paginare">
              {page > 1 ? (
                <Link href={href(page - 1)} className="font-medium text-brand-700">
                  ← Mai noi
                </Link>
              ) : (
                <span />
              )}
              <span className="text-slate-500">
                Pagina {page} din {pages}
              </span>
              {page < pages ? (
                <Link href={href(page + 1)} className="font-medium text-brand-700">
                  Mai vechi →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </Card>
  );
}
