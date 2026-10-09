import { ComingSoon, PageHeader } from "@/components/layout/page-header";
import { requirePermission } from "@/lib/auth/session";

export const metadata = { title: "Setări" };

export default async function Page() {
  await requirePermission("settings.manage");
  return (
    <>
      <PageHeader title="Setări" />
      <ComingSoon milestone={2}>Utilizatori, categorii, canale, locații și cursuri valutare.</ComingSoon>
    </>
  );
}
