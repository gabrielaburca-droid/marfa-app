import { ComingSoon, PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { requireSession } from "@/lib/auth/session";

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const { user } = await requireSession();
  const { parola, eroare } = await searchParams;
  return (
    <>
      <PageHeader title="Dashboard" description={`Bun venit, ${user.fullName || user.email}.`} />
      <div className="space-y-4">
        {parola === "ok" && <Alert tone="success">Parola a fost salvată.</Alert>}
        {eroare === "acces" && <Alert tone="error">Nu aveți acces la pagina cerută.</Alert>}
        <ComingSoon milestone={4}>Indicatorii financiari vor apărea aici.</ComingSoon>
      </div>
    </>
  );
}
