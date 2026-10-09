import { describe, expect, it } from "vitest";
import { parseBnrXml } from "./bnr";

// Shape of https://www.bnr.ro/nbrfxrates.xml (values made up for the test).
const SAMPLE = `<?xml version="1.0" encoding="utf-8"?>
<DataSet xmlns="http://www.bnr.ro/xsd">
  <Header><Publisher>National Bank of Romania</Publisher><PublishingDate>2026-10-08</PublishingDate></Header>
  <Body>
    <Subject>Reference rates</Subject>
    <OrigCurrency>RON</OrigCurrency>
    <Cube date="2026-10-08">
      <Rate currency="EUR">4.9767</Rate>
      <Rate currency="HUF" multiplier="100">1.2611</Rate>
      <Rate currency="PLN">1.1689</Rate>
      <Rate currency="TRY">0.1032</Rate>
    </Cube>
  </Body>
</DataSet>`;

describe("parseBnrXml", () => {
  it("reads the date and the rates as exact strings", () => {
    const r = parseBnrXml(SAMPLE);
    expect(r.date).toBe("2026-10-08");
    expect(r.rates.EUR).toBe("4.9767");
    expect(r.rates.PLN).toBe("1.1689");
  });
  it("divides rates quoted per 100 units", () => {
    expect(parseBnrXml(SAMPLE).rates.HUF).toBe("0.012611");
  });
  it("fails clearly on an unexpected document", () => {
    expect(() => parseBnrXml("<html>maintenance</html>")).toThrow();
  });
});
