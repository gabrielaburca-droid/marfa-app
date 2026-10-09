import { randomUUID } from "node:crypto";
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
let ch: Record<string, string>;

beforeAll(async () => {
  biz = await createBusiness("Reguli");
  admin = await createUser("rules-admin");
  await addMember(biz, admin.id, "admin");
  const names = ["Târg Bacău", "Târg Suceava", "OLX", "Vinted"];
  ch = Object.fromEntries(await Promise.all(names.map(async (n) => [n, await channelId(biz, n)])));
});

function income(fields: Record<string, unknown>) {
  return admin.client
    .from("income_entries")
    .insert({ business_id: biz, description: "test", ...fields })
    .select("*")
    .single();
}

describe("aggregate market income", () => {
  it("saves a whole market day as one entry and links the location", async () => {
    const { data, error } = await income({
      entry_kind: "aggregate",
      entry_date: "2026-10-10",
      channel_id: ch["Târg Suceava"],
      gross_amount: 5000,
    });
    expect(error).toBeNull();
    expect(data.net_amount_ron).toBe(5000);
    expect(data.period_start).toBe("2026-10-10");
    expect(data.received_on).toBe("2026-10-10");
    expect(data.market_location_id).not.toBeNull();
  });

  it("allows several entries for the same day and location", async () => {
    const a = await income({
      entry_kind: "aggregate",
      entry_date: "2026-10-12",
      channel_id: ch["Târg Bacău"],
      gross_amount: 1000,
    });
    const b = await income({
      entry_kind: "aggregate",
      entry_date: "2026-10-12",
      channel_id: ch["Târg Bacău"],
      gross_amount: 2000,
    });
    expect(a.error).toBeNull();
    expect(b.error).toBeNull();
  });

  it("accepts a cash/card split that adds up to the total", async () => {
    const { data, error } = await income({
      entry_kind: "aggregate",
      entry_date: "2026-10-13",
      channel_id: ch["Târg Bacău"],
      gross_amount: 4200,
      payment_method: "mixed",
      cash_amount: 3000,
      card_amount: 1200,
    });
    expect(error).toBeNull();
    expect(data.net_amount_ron).toBe(4200); // the split adds nothing
  });

  it("rejects a cash/card split that does not match the total", async () => {
    const { error } = await income({
      entry_kind: "aggregate",
      entry_date: "2026-10-13",
      channel_id: ch["Târg Bacău"],
      gross_amount: 4200,
      cash_amount: 3000,
      card_amount: 1000,
    });
    expect(error?.code).toBe("23514");
  });
});

describe("online sales", () => {
  it("computes net revenue after discount, refund, commission and shipping", async () => {
    const { data, error } = await income({
      entry_kind: "sale",
      entry_date: "2026-10-05",
      channel_id: ch["OLX"],
      product_name: "Fierbător",
      gross_amount: 150,
      discount_amount: 10,
      commission_amount: 7.5,
      shipping_amount: 15.25,
    });
    expect(error).toBeNull();
    expect(data.net_amount).toBe(117.25);
    expect(data.net_amount_ron).toBe(117.25);
  });

  it("converts foreign currency to RON with the stored rate", async () => {
    const { data } = await income({
      entry_kind: "sale",
      entry_date: "2026-10-06",
      channel_id: ch["Vinted"],
      currency: "EUR",
      exchange_rate: 4.9767,
      gross_amount: 20,
      commission_amount: 1.15,
    });
    expect(data.gross_amount_ron).toBe(99.53); // 20 × 4.9767 = 99.534
    expect(data.net_amount_ron).toBe(93.81); // 18.85 × 4.9767 = 93.810795
  });

  it("forces the RON exchange rate to 1", async () => {
    const { data } = await income({
      entry_kind: "sale",
      entry_date: "2026-10-06",
      channel_id: ch["OLX"],
      exchange_rate: 5,
      gross_amount: 10,
    });
    expect(Number(data.exchange_rate)).toBe(1);
    expect(data.net_amount_ron).toBe(10);
  });

  it("rejects discounts larger than the price", async () => {
    const { error } = await income({
      entry_kind: "sale",
      entry_date: "2026-10-06",
      channel_id: ch["OLX"],
      gross_amount: 10,
      discount_amount: 11,
    });
    expect(error?.code).toBe("23514");
  });
});

describe("duplicate prevention", () => {
  it("ignores a double-submitted form (same client token)", async () => {
    const token = randomUUID();
    const first = await income({
      entry_kind: "aggregate",
      entry_date: "2026-10-14",
      channel_id: ch["Târg Bacău"],
      gross_amount: 10,
      client_token: token,
    });
    const second = await income({
      entry_kind: "aggregate",
      entry_date: "2026-10-14",
      channel_id: ch["Târg Bacău"],
      gross_amount: 10,
      client_token: token,
    });
    expect(first.error).toBeNull();
    expect(second.error?.code).toBe("23505");
  });

  it("rejects the same order reference twice on a channel", async () => {
    const ref = `OLX-${randomUUID().slice(0, 6)}`;
    const first = await income({
      entry_kind: "sale",
      entry_date: "2026-10-07",
      channel_id: ch["OLX"],
      gross_amount: 50,
      reference: ref,
    });
    const second = await income({
      entry_kind: "sale",
      entry_date: "2026-10-08",
      channel_id: ch["OLX"],
      gross_amount: 50,
      reference: ref.toLowerCase(),
    });
    expect(first.error).toBeNull();
    expect(second.error?.code).toBe("23505");
  });

  it("rejects an aggregate over a period that already has individual sales", async () => {
    await income({
      entry_kind: "sale",
      entry_date: "2026-09-10",
      channel_id: ch["Vinted"],
      gross_amount: 30,
    });
    const { error } = await income({
      entry_kind: "aggregate",
      entry_date: "2026-09-30",
      period_start: "2026-09-01",
      period_end: "2026-09-30",
      channel_id: ch["Vinted"],
      gross_amount: 900,
    });
    expect(error?.code).toBe("23P01");
    expect(error?.details).toMatch(/vânzări individuale/);
  });

  it("rejects an individual sale inside a period already covered by an aggregate", async () => {
    const agg = await income({
      entry_kind: "aggregate",
      entry_date: "2026-08-31",
      period_start: "2026-08-01",
      period_end: "2026-08-31",
      channel_id: ch["OLX"],
      gross_amount: 2500,
    });
    expect(agg.error).toBeNull();
    const { error } = await income({
      entry_kind: "sale",
      entry_date: "2026-08-15",
      channel_id: ch["OLX"],
      gross_amount: 40,
    });
    expect(error?.code).toBe("23P01");

    // Another channel on the same day is fine.
    const other = await income({
      entry_kind: "sale",
      entry_date: "2026-08-15",
      channel_id: ch["Vinted"],
      gross_amount: 40,
    });
    expect(other.error).toBeNull();
  });

  it("allows the sale again once the conflicting aggregate is deleted", async () => {
    const agg = await income({
      entry_kind: "aggregate",
      entry_date: "2026-07-31",
      period_start: "2026-07-01",
      period_end: "2026-07-31",
      channel_id: ch["Vinted"],
      gross_amount: 100,
    });
    await admin.client
      .from("income_entries")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", agg.data.id);
    const { error } = await income({
      entry_kind: "sale",
      entry_date: "2026-07-15",
      channel_id: ch["Vinted"],
      gross_amount: 40,
    });
    expect(error).toBeNull();
  });
});

describe("expenses", () => {
  it("stores amount, rate and RON equivalent; defaults the payment date", async () => {
    const { data, error } = await admin.client
      .from("expenses")
      .insert({
        business_id: biz,
        expense_date: "2026-10-02",
        category_id: await expenseCategoryId(biz, "Achiziții marfă"),
        currency: "PLN",
        exchange_rate: 1.1689,
        amount: 12500,
        description: "Lot marfă Polonia",
      })
      .select("amount_ron, paid_on")
      .single();
    expect(error).toBeNull();
    expect(data!.amount_ron).toBe(14611.25);
    expect(data!.paid_on).toBe("2026-10-02");
  });

  it("rejects zero or negative amounts", async () => {
    const { error } = await admin.client.from("expenses").insert({
      business_id: biz,
      expense_date: "2026-10-02",
      category_id: await expenseCategoryId(biz, "Amenzi"),
      amount: 0,
    });
    expect(error?.code).toBe("23514");
  });
});
