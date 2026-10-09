/** Currencies offered in forms besides RON. */
export const COMMON_CURRENCIES = [
  "EUR",
  "USD",
  "GBP",
  "PLN",
  "HUF",
  "TRY",
  "CNY",
  "CHF",
  "BGN",
  "CZK",
  "UAH",
  "MDL",
] as const;

export const CURRENCY_NAMES: Record<string, string> = {
  RON: "Leu românesc",
  EUR: "Euro",
  USD: "Dolar american",
  GBP: "Liră sterlină",
  PLN: "Zlot polonez",
  HUF: "Forint maghiar",
  TRY: "Liră turcească",
  CNY: "Yuan chinezesc",
  CHF: "Franc elvețian",
  BGN: "Leva bulgărească",
  CZK: "Coroană cehă",
  UAH: "Grivnă ucraineană",
  MDL: "Leu moldovenesc",
};
