import { describe, expect, it } from "vitest";
import { newPasswordSchema, safeNextPath, signInSchema } from "./auth";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/incasari")).toBe("/incasari");
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "", null, undefined])(
    "rejects %s",
    (value) => expect(safeNextPath(value)).toBe("/"),
  );
});

describe("signInSchema", () => {
  it("normalizes the email", () => {
    const r = signInSchema.parse({ email: "  Ion@Firma.RO ", password: "x" });
    expect(r.email).toBe("ion@firma.ro");
  });
  it("gives Romanian messages", () => {
    const r = signInSchema.safeParse({ email: "nu-e-email", password: "" });
    expect(r.success).toBe(false);
    const messages = r.error!.issues.map((i) => i.message);
    expect(messages).toContain("Adresa de email nu este validă.");
    expect(messages).toContain("Introduceți parola.");
  });
});

describe("newPasswordSchema", () => {
  it("requires 10 characters and matching confirmation", () => {
    expect(newPasswordSchema.safeParse({ password: "scurta", confirm: "scurta" }).success).toBe(false);
    expect(newPasswordSchema.safeParse({ password: "o-parola-buna", confirm: "alta-parola-1" }).success).toBe(
      false,
    );
    expect(newPasswordSchema.safeParse({ password: "o-parola-buna", confirm: "o-parola-buna" }).success).toBe(
      true,
    );
  });
});
