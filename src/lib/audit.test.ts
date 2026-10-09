import { describe, expect, it } from "vitest";
import { summarizeChanges } from "./audit";

describe("summarizeChanges", () => {
  it("lists changed fields with old and new values", () => {
    expect(
      summarizeChanges("update", {
        gross_amount: { old: 400, new: 450 },
        net_amount_ron: { old: 400, new: 450 },
        is_active: { old: true, new: false },
      }),
    ).toBe("sumă: 400 → 450; activ: da → nu");
  });
  it("names the created record", () => {
    expect(summarizeChanges("insert", { id: "x", name: "Viniete" })).toBe("Viniete");
  });
});
