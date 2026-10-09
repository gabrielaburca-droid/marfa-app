import { describe, expect, it } from "vitest";
import { dbErrorMessage } from "./db-errors";

describe("dbErrorMessage", () => {
  it("explains duplicates and permission errors in Romanian", () => {
    expect(dbErrorMessage({ code: "23505" })).toMatch(/Există deja/);
    expect(dbErrorMessage({ code: "42501", message: "new row violates row-level security policy" })).toBe(
      "Nu aveți drepturi pentru această operație.",
    );
  });
  it("passes through our own trigger messages", () => {
    const message = "Firma trebuie să aibă cel puțin un administrator activ.";
    expect(dbErrorMessage({ code: "42501", message })).toBe(message);
    expect(dbErrorMessage({ code: "23P01", message: "INCOME_OVERLAP", details: "Pentru acest canal…" })).toBe(
      "Pentru acest canal…",
    );
  });
  it("falls back for unknown errors", () => {
    expect(dbErrorMessage({ code: "XX000" }, "Eroare")).toBe("Eroare");
  });
});
