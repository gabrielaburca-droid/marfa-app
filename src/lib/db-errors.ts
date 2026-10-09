type PgError = { code?: string; message?: string; details?: string | null } | null | undefined;

/** Turns a Postgres/PostgREST error into a message a user can act on. */
export function dbErrorMessage(
  error: PgError,
  fallback = "Operația nu a reușit. Încercați din nou.",
): string {
  if (!error) return fallback;
  switch (error.code) {
    case "23505":
      return "Există deja o înregistrare cu aceleași date.";
    case "23503":
      return "Una dintre valorile alese nu mai există sau nu aparține firmei.";
    case "23514":
      return "Unele valori nu sunt valide. Verificați sumele și datele.";
    case "23P01":
      return error.details || "Înregistrarea se suprapune cu una existentă.";
    case "42501":
      // Our triggers raise Romanian messages with this code; RLS denials don't.
      return error.message && /[ăâîșțĂÂÎȘȚ]/.test(error.message)
        ? error.message
        : "Nu aveți drepturi pentru această operație.";
    case "PGRST116":
      return "Înregistrarea nu a fost găsită sau nu aveți acces la ea.";
    default:
      return fallback;
  }
}
