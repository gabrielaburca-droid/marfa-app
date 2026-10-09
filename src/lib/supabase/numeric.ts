/**
 * Postgres NUMERIC columns are typed as `number` by the generated types, but
 * PostgREST accepts a decimal string and stores it exactly. Sending the
 * validated string avoids any float rounding on the way to the database.
 */
export function numeric(value: string): number {
  return value as unknown as number;
}
