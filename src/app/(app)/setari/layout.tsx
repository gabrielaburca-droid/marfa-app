import { PageHeader } from "@/components/layout/page-header";
import { requirePermission } from "@/lib/auth/session";
import { SettingsNav } from "./settings-nav";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("settings.manage");
  return (
    <>
      <PageHeader title="Setări" />
      <SettingsNav />
      {children}
    </>
  );
}
