import { describe, expect, it } from "vitest";
import { can } from "./permissions";

const admin = { role: "admin" as const, canViewReports: false };
const operator = { role: "operator" as const, canViewReports: false };
const reporter = { role: "operator" as const, canViewReports: true };

describe("can", () => {
  it("lets admins do everything", () => {
    for (const p of ["users.manage", "settings.manage", "records.delete", "reports.view", "audit.view"] as const) {
      expect(can(admin, p)).toBe(true);
    }
  });

  it("keeps operators out of administration and deletion", () => {
    for (const p of ["users.manage", "settings.manage", "records.delete", "records.editAny", "audit.view"] as const) {
      expect(can(operator, p)).toBe(false);
      expect(can(reporter, p)).toBe(false);
    }
  });

  it("lets operators record and edit their own entries", () => {
    expect(can(operator, "records.create")).toBe(true);
    expect(can(operator, "records.editOwn")).toBe(true);
  });

  it("shows reports to operators only when granted", () => {
    expect(can(operator, "reports.view")).toBe(false);
    expect(can(reporter, "reports.view")).toBe(true);
    expect(can(reporter, "records.viewAll")).toBe(true);
  });
});
