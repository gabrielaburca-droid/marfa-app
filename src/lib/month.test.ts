import { describe, expect, it } from "vitest";
import { defaultDateIn, monthLabel, monthRange, parseMonth, shiftMonth } from "./month";

describe("month helpers", () => {
  it("parses only YYYY-MM", () => {
    expect(parseMonth("2026-09")).toBe("2026-09");
    expect(parseMonth("2026-13")).toBeNull();
    expect(parseMonth("2026-9")).toBeNull();
    expect(parseMonth(["2026-09"])).toBeNull();
    expect(parseMonth(undefined)).toBeNull();
  });

  it("gives the first and last day", () => {
    expect(monthRange("2026-09")).toEqual(["2026-09-01", "2026-09-30"]);
    expect(monthRange("2028-02")).toEqual(["2028-02-01", "2028-02-29"]);
  });

  it("moves across years", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-09", 0)).toBe("2026-09");
  });

  it("names months in Romanian", () => {
    expect(monthLabel("2026-09")).toBe("Septembrie 2026");
  });

  it("prefills a date inside the chosen month", () => {
    expect(defaultDateIn("2026-10", "2026-10-09")).toBe("2026-10-09");
    expect(defaultDateIn("2026-09", "2026-10-09")).toBe("2026-09-30");
    expect(defaultDateIn("2026-11", "2026-10-09")).toBe("2026-11-01");
  });
});
