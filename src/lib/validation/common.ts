import { z } from "zod";

export const nameSchema = z
  .string({ error: "Introduceți un nume." })
  .trim()
  .min(1, "Introduceți un nume.")
  .max(100, "Numele poate avea cel mult 100 de caractere.");

/** Empty input becomes null. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Textul poate avea cel mult ${max} caractere.`)
    .optional()
    .transform((v) => (v ? v : null));

export const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");

export const uuidSchema = z.uuid({ error: "Valoare invalidă." });

export const optionalUuid = z
  .string()
  .optional()
  .transform((v) => (v ? v : null))
  .pipe(z.uuid({ error: "Valoare invalidă." }).nullable());

export const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Codul monedei are 3 litere (ex. EUR).");

export const dateSchema = z.iso.date({ error: "Alegeți o dată validă." });

/**
 * Parses a decimal typed in Romanian or English style ("1.234,56", "1234.56",
 * "4,9767") into a canonical string such as "1234.56". The value stays a
 * string so no floating-point rounding happens before Postgres stores it.
 */
export function normalizeDecimal(input: string, opts: { dotGroupsThousands?: boolean } = {}): string | null {
  let s = input.trim().replace(/[\s\u00a0]/g, "");
  if (!s) return null;
  // Amounts typed the Romanian way: "5.000" means five thousand.
  if (opts.dotGroupsThousands && /^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // Whichever separator comes last is the decimal separator.
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma > -1) {
    s = s.match(/,/g)!.length > 1 ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if ((s.match(/\./g)?.length ?? 0) > 1) {
    s = s.replace(/\./g, "");
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const [int, frac] = s.split(".");
  const cleanInt = int.replace(/^(-?)0+(?=\d)/, "$1");
  return frac ? `${cleanInt}.${frac}` : cleanInt;
}

export const decimalSchema = (opts: {
  scale: number;
  min?: "zero" | "positive";
  label: string;
  dotGroupsThousands?: boolean;
}) =>
  z.string({ error: `Introduceți ${opts.label}.` }).transform((v, ctx) => {
    const n = normalizeDecimal(v, opts);
    if (n === null) {
      ctx.addIssue({ code: "custom", message: `${capitalize(opts.label)} nu este un număr valid.` });
      return z.NEVER;
    }
    const frac = n.split(".")[1] ?? "";
    if (frac.length > opts.scale) {
      ctx.addIssue({ code: "custom", message: `Folosiți cel mult ${opts.scale} zecimale.` });
      return z.NEVER;
    }
    if (n.startsWith("-") || (opts.min === "positive" && /^0(\.0+)?$/.test(n))) {
      ctx.addIssue({
        code: "custom",
        message:
          opts.min === "positive"
            ? `${capitalize(opts.label)} trebuie să fie mai mare decât 0.`
            : `${capitalize(opts.label)} nu poate fi negativ.`,
      });
      return z.NEVER;
    }
    return n;
  });

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
