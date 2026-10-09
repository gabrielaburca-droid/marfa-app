import { ComingSoon, PageHeader } from "@/components/layout/page-header";
import { requireSession } from "@/lib/auth/session";

export const metadata = { title: "Încasări" };

export default async function Page() {
  await requireSession();
  return (
    <>
      <PageHeader title="Încasări" />
      <ComingSoon milestone={3}>Înregistrarea încasărilor de la târguri și online.</ComingSoon>
    </>
  );
}
