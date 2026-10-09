import { beforeAll, describe, expect, it } from "vitest";
import {
  addMember,
  channelId,
  createBusiness,
  createUser,
  expenseCategoryId,
  type TestUser,
} from "./helpers";

let biz: string;
let admin: TestUser;
let operator: TestUser;
let ch: Record<string, string>;
let merchandise: string;

const report = (u: TestUser, from = "2026-09-01", to = "2026-09-30") =>
  u.client.rpc("month_report", { p_business: biz, p_from: from, p_to: to });

beforeAll(async () => {
  biz = await createBusiness("Raport");
  admin = await createUser("report-admin");
  operator = await createUser("report-operator");
  await addMember(biz, admin.id, "admin");
  await addMember(biz, operator.id, "operator");
  const names = ["Târg Suceava", "Vinted", "Instagram", "Clienți direcți"];
  ch = Object.fromEntries(await Promise.all(names.map(async (n) => [n, await channelId(biz, n)])));
  merchandise = await expenseCategoryId(biz, "Achiziții marfă");

  const ins = (u: TestUser, f: Record<string, unknown>) =>
    u.client
      .from("income_entries")
      .insert({ business_id: biz, ...f })
      .select("id")
      .single();
  await ins(admin, {
    entry_kind: "aggregate",
    entry_date: "2026-09-13",
    channel_id: ch["Târg Suceava"],
    gross_amount: "6170",
  });
  await ins(admin, {
    entry_kind: "aggregate",
    entry_date: "2026-09-27",
    channel_id: ch["Târg Suceava"],
    gross_amount: "6790",
  });
  await ins(admin, {
    entry_kind: "sale",
    entry_date: "2026-09-20",
    channel_id: ch.Vinted,
    gross_amount: "290",
    commission_amount: "0.10",
  });
  await ins(operator, {
    entry_kind: "sale",
    entry_date: "2026-09-21",
    channel_id: ch.Instagram,
    gross_amount: "250",
  });
  // Not counted: other month, deleted, cancelled.
  await ins(admin, {
    entry_kind: "sale",
    entry_date: "2026-10-01",
    channel_id: ch.Vinted,
    gross_amount: "999",
  });
  const del = await ins(admin, {
    entry_kind: "sale",
    entry_date: "2026-09-05",
    channel_id: ch["Clienți direcți"],
    gross_amount: "100",
  });
  await admin.client
    .from("income_entries")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", del.data!.id);
  await ins(admin, {
    entry_kind: "sale",
    entry_date: "2026-09-06",
    channel_id: ch["Clienți direcți"],
    gross_amount: "70",
    status: "cancelled",
  });

  await admin.client.from("expenses").insert({
    business_id: biz,
    expense_date: "2026-09-01",
    category_id: merchandise,
    currency: "EUR",
    exchange_rate: "5.08",
    amount: "2890",
  });
});

describe("month_report", () => {
  it("sums the month exactly, by channel and expense group", async () => {
    const { data, error } = await report(admin);
    expect(error).toBeNull();
    expect(data).toMatchObject({
      income: "13499.90",
      income_count: 4,
      expenses: "14681.20",
      expense_count: 1,
      fines: "0",
      groups: [{ group: "merchandise", total: "14681.20", count: 1 }],
    });
    expect(
      data.channels.map((c: { name: string; total: string; count: number }) => [c.name, c.total, c.count]),
    ).toEqual([
      ["Târg Suceava", "12960.00", 2],
      ["Vinted", "289.90", 1],
      ["Instagram", "250.00", 1],
    ]);
  });

  it("shows an operator without report access only their own records", async () => {
    const { data } = await report(operator);
    expect(data).toMatchObject({ income: "250.00", income_count: 1, expenses: "0", expense_count: 0 });
  });

  it("returns zeros for an empty month and nothing for another business", async () => {
    const empty = await report(admin, "2026-07-01", "2026-07-31");
    expect(empty.data).toMatchObject({ income: "0", income_count: 0, channels: [], groups: [] });
    const outsider = await createUser("report-outsider");
    const other = await report(outsider);
    expect(other.data).toMatchObject({ income: "0", expense_count: 0 });
  });

  it("finds the latest month with records", async () => {
    const { data } = await admin.client.rpc("latest_activity_month", {
      p_business: biz,
      p_until: "2026-10-09",
    });
    expect(data).toBe("2026-10-01");
    const before = await admin.client.rpc("latest_activity_month", {
      p_business: biz,
      p_until: "2026-09-30",
    });
    expect(before.data).toBe("2026-09-01");
  });

  it("is not callable anonymously", async () => {
    const { anonClient } = await import("./helpers");
    const { error } = await anonClient().rpc("month_report", {
      p_business: biz,
      p_from: "2026-09-01",
      p_to: "2026-09-30",
    });
    expect(error).not.toBeNull();
  });
});
