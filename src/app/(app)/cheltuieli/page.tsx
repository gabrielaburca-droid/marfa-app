import { ComingSoon, PageHeader } from "@/components/layout/page-header";
import { requireSession } from "@/lib/auth/session";

export const metadata = { title: "Cheltuieli" };

export default async function Page() {
  await requireSession();
  return (
    <>
      <PageHeader title="Cheltuieli" />
      <ComingSoon milestone={3}>Înregistrarea cheltuielilor.</ComingSoon>
    </>
  );
}
