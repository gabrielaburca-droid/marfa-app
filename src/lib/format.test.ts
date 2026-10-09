import { describe, expect, it } from "vitest";
import { formatDate, formatRON, todayRO } from "./format";

describe("format", () => {
  it("formats RON the Romanian way", () => {
    expect(formatRON(5000).replace(/\u00a0/g, " ")).toBe("5.000,00 RON");
    expect(formatRON("1234.5").replace(/\u00a0/g, " ")).toBe("1.234,50 RON");
  });
  it("formats dates as dd.mm.yyyy", () => {
    expect(formatDate("2026-10-10")).toBe("10.10.2026");
  });
  it("uses the Bucharest calendar day", () => {
    expect(todayRO(new Date("2026-10-09T22:30:00Z"))).toBe("2026-10-10");
  });
});
