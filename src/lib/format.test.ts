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

describe("greetingRO", () => {
  it("follows the time in Romania", async () => {
    const { greetingRO } = await import("./format");
    expect(greetingRO(new Date("2026-10-09T05:00:00Z"))).toBe("Bună dimineața"); // 08:00 in Bucharest
    expect(greetingRO(new Date("2026-10-09T11:00:00Z"))).toBe("Bună ziua");
    expect(greetingRO(new Date("2026-10-09T17:30:00Z"))).toBe("Bună seara");
  });
});
