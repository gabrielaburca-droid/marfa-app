import { describe, expect, it } from "vitest";
import { expenseSchema, marketIncomeSchema, saleIncomeSchema, toRon } from "./finance";

const ID = "11111111-1111-4111-8111-111111111111";
const TOKEN = "22222222-2222-4222-8222-222222222222";

describe("marketIncomeSchema", () => {
  const base = { channel_id: ID, entry_date: "2026-09-30", client_token: TOKEN };

  it("reads Romanian amounts", () => {
    const r = marketIncomeSchema.parse({ ...base, gross_amount: "6.170" });
    expect(r.gross_amount).toBe("6170");
    expect(r.cash_amount).toBeNull();
    expect(r.card_amount).toBeNull();
  });

  it("fills the other half of a cash/card split", () => {
    const r = marketIncomeSchema.parse({ ...base, gross_amount: "5000", cash_amount: "3.800,50" });
    expect(r.cash_amount).toBe("3800.50");
    expect(r.card_amount).toBe("1199.50");
  });

  it("rejects a split that does not add up to the total", () => {
    const r = marketIncomeSchema.safeParse({
      ...base,
      gross_amount: "5000",
      cash_amount: "4000",
      card_amount: "2000",
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["cash_amount"]);
  });

  it("requires a positive total", () => {
    expect(marketIncomeSchema.safeParse({ ...base, gross_amount: "0" }).success).toBe(false);
  });
});

describe("saleIncomeSchema", () => {
  const base = { channel_id: ID, entry_date: "2026-09-30", client_token: TOKEN, product_name: "Lot Goebel" };

  it("defaults empty deductions to 0", () => {
    const r = saleIncomeSchema.parse({ ...base, gross_amount: "290", commission_amount: "", buyer: "" });
    expect(r).toMatchObject({
      gross_amount: "290",
      commission_amount: "0",
      shipping_amount: "0",
      buyer: null,
    });
  });

  it("rejects deductions larger than the price", () => {
    const r = saleIncomeSchema.safeParse({
      ...base,
      gross_amount: "50",
      commission_amount: "30",
      shipping_amount: "25",
    });
    expect(r.success).toBe(false);
  });

  it("needs a product", () => {
    expect(saleIncomeSchema.safeParse({ ...base, product_name: " ", gross_amount: "10" }).success).toBe(
      false,
    );
  });
});

describe("expenseSchema", () => {
  const base = { expense_date: "2026-09-01", category_id: ID, client_token: TOKEN };

  it("forces the RON rate to 1", () => {
    const r = expenseSchema.parse({ ...base, amount: "180", currency: "RON", exchange_rate: "4" });
    expect(r.exchange_rate).toBe("1");
  });

  it("needs a rate for a foreign currency", () => {
    expect(
      expenseSchema.safeParse({ ...base, amount: "2890", currency: "EUR", exchange_rate: "" }).success,
    ).toBe(false);
    const r = expenseSchema.parse({ ...base, amount: "2.890", currency: "eur", exchange_rate: "5,0812" });
    expect(r).toMatchObject({ amount: "2890", currency: "EUR", exchange_rate: "5.0812" });
  });
});

describe("toRon", () => {
  it("multiplies exactly and rounds half up", () => {
    expect(toRon("2890", "5,08")).toBe("14681.20");
    expect(toRon("0,01", "0,5")).toBe("0.01");
    expect(toRon("10", "4,976749")).toBe("49.77");
  });
  it("returns null for bad input", () => {
    expect(toRon("abc", "5")).toBeNull();
  });
});
