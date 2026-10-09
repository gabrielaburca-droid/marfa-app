export type Role = "admin" | "operator";

export type Membership = {
  businessId: string;
  businessName: string;
  role: Role;
  canViewReports: boolean;
};

export type Permission =
  | "records.create"
  | "records.editOwn"
  | "records.editAny"
  | "records.delete"
  | "records.viewAll"
  | "reports.view"
  | "settings.manage"
  | "users.manage"
  | "audit.view";

const ADMIN_ONLY: Permission[] = [
  "records.editAny",
  "records.delete",
  "settings.manage",
  "users.manage",
  "audit.view",
];

/**
 * UI-level permission check. It only decides what to show; the database
 * (RLS + triggers) enforces the same rules independently.
 */
export function can(m: Pick<Membership, "role" | "canViewReports">, p: Permission): boolean {
  if (m.role === "admin") return true;
  if (ADMIN_ONLY.includes(p)) return false;
  if (p === "reports.view" || p === "records.viewAll") return m.canViewReports;
  return true;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  operator: "Operator",
};
