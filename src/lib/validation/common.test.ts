import { describe, expect, it } from "vitest";
import { decimalSchema, normalizeDecimal } from "./common";

describe("normalizeDecimal", () => {
  it.each([
    ["5000", "5000"],
    ["4.976", "4.976"],
    ["5.000,50", "5000.50"],
    ["1,234.56", "1234.56"],
    ["4,9767", "4.9767"],
    ["4.9767", "4.9767"],
    [" 1 234,5 ", "1234.5"],
    ["0,10", "0.10"],
    ["007", "7"],
  ])("%s → %s", (input, expected) => expect(normalizeDecimal(input)).toBe(expected));

  it("reads 5.000 as five thousand for amounts", () => {
    expect(normalizeDecimal("5.000", { dotGroupsThousands: true })).toBe("5000");
    expect(normalizeDecimal("12.500.000", { dotGroupsThousands: true })).toBe("12500000");
    expect(normalizeDecimal("5.5", { dotGroupsThousands: true })).toBe("5.5");
  });

  it.each(["", "abc", "1,2,3.4.5", "12a"])("rejects %j", (input) =>
    expect(normalizeDecimal(input)).toBeNull(),
  );
});

describe("decimalSchema", () => {
  const rate = decimalSchema({ scale: 6, min: "positive", label: "cursul" });
  it("keeps the value as an exact string", () => {
    expect(rate.parse("4,976712")).toBe("4.976712");
  });
  it("rejects too many decimals, zero and negatives", () => {
    expect(rate.safeParse("4,9767123").success).toBe(false);
    expect(rate.safeParse("0").success).toBe(false);
    expect(rate.safeParse("-1").success).toBe(false);
  });
});
