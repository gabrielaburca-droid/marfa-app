import { z } from "zod";

export const emailSchema = z
  .string({ error: "Introduceți adresa de email." })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Adresa de email nu este validă." }));

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string({ error: "Introduceți parola." }).min(1, "Introduceți parola."),
});

export const passwordResetRequestSchema = z.object({ email: emailSchema });

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(10, "Parola trebuie să aibă cel puțin 10 caractere.")
      .max(72, "Parola poate avea cel mult 72 de caractere."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Parolele nu coincid.",
  });

/** Only same-origin relative paths are allowed as post-login redirects. */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

export type FormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export function fieldErrors(error: z.ZodError): FormState {
  return {
    ok: false,
    message: "Verificați câmpurile marcate.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[] | undefined>,
  };
}
