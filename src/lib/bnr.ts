import Decimal from "decimal.js";

export type BnrRates = { date: string; rates: Record<string, string> };

/**
 * Parses the National Bank of Romania XML feed (nbrfxrates.xml).
 * Rates are returned as exact decimal strings in RON per 1 unit; rates
 * quoted per 100 units (e.g. HUF) are divided by their multiplier.
 */
export function parseBnrXml(xml: string): BnrRates {
  const cube = /<Cube date="(\d{4}-\d{2}-\d{2})">([\s\S]*?)<\/Cube>/.exec(xml);
  if (!cube) throw new Error("BNR feed has no rates");
  const rates: Record<string, string> = {};
  const re = /<Rate currency="([A-Z]{3})"(?:\s+multiplier="(\d+)")?>([\d.]+)<\/Rate>/g;
  for (const m of cube[2].matchAll(re)) {
    const [, currency, multiplier, value] = m;
    rates[currency] = new Decimal(value)
      .div(multiplier ?? 1)
      .toDecimalPlaces(6)
      .toFixed();
  }
  return { date: cube[1], rates };
}

export async function fetchBnrRates(): Promise<BnrRates> {
  const res = await fetch("https://www.bnr.ro/nbrfxrates.xml", {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`BNR responded ${res.status}`);
  return parseBnrXml(await res.text());
}
