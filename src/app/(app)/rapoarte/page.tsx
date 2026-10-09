import { ComingSoon, PageHeader } from "@/components/layout/page-header";
import { requirePermission } from "@/lib/auth/session";

export const metadata = { title: "Rapoarte" };

export default async function Page() {
  await requirePermission("reports.view");
  return (
    <>
      <PageHeader title="Rapoarte" />
      <ComingSoon milestone={5}>Rapoarte și exporturi CSV/Excel.</ComingSoon>
    </>
  );
}
