import { expect, test, type Page } from "@playwright/test";
import { addMember, createBusiness, expectToast, login, newUser } from "./helpers";

async function adminSession(page: Page) {
  const biz = await createBusiness("Bani E2E");
  const admin = await newUser("admin-finance");
  await addMember(biz, admin.id, "admin");
  await login(page, admin.email);
  await expect(page.getByRole("heading", { level: 1, name: /^Bună/ })).toBeVisible();
}

test("market day, sale and EUR expense show up in the month report", async ({ page }) => {
  await adminSession(page);

  // Market day total with a cash part; the card part is filled in.
  await page.goto("/incasari?luna=2026-09&nou=targ");
  const market = page.getByRole("dialog", { name: "Încasare târg" });
  await market.getByText("Târg Suceava").click();
  await market.getByLabel("Total încasat în ziua respectivă").fill("6.170");
  await market.getByLabel("Data").fill("2026-09-13");
  await market.getByText("Numerar și card (opțional)").click();
  await market.getByLabel("Numerar").fill("5000");
  await market.getByRole("button", { name: "Salvează încasarea" }).click();
  await expectToast(page, "Încasarea a fost salvată.");
  await expect(page).toHaveURL(/luna=2026-09$/);
  await expect(page.locator("li").filter({ hasText: "Târg Suceava" })).toContainText("card 1.170,00 RON");

  // A Vinted sale with a commission: the net is what counts.
  await page.goto("/incasari?luna=2026-09&nou=online");
  const sale = page.getByRole("dialog", { name: "Vânzare" });
  await sale.getByText("Vinted", { exact: true }).click();
  await sale.getByLabel("Ce ai vândut").fill("Lot Goebel");
  await sale.getByLabel("Preț").fill("290");
  await sale.getByLabel("Data").fill("2026-09-20");
  await sale.getByText("Comision, transport, reducere (opțional)").click();
  await sale.getByLabel("Comision").fill("10");
  await expect(sale.getByText("Rămâne: 280,00 RON")).toBeVisible();
  await sale.getByRole("button", { name: "Salvează vânzarea" }).click();
  await expectToast(page, "Vânzarea a fost salvată.");

  // Merchandise bought in EUR, converted with the typed rate.
  await page.goto("/cheltuieli?luna=2026-09&nou=1");
  const exp = page.getByRole("dialog", { name: "Cheltuială" });
  await exp.getByLabel("Categorie").selectOption({ label: "Achiziții marfă" });
  await exp.getByLabel("Descriere (opțional)").fill("Lot marfă septembrie");
  await exp.getByLabel("Sumă").fill("2.890");
  await exp.getByLabel("Monedă").selectOption("EUR");
  await exp.getByLabel(/Curs/).fill("5,08");
  await expect(exp.getByText("În lei: 14.681,20 RON")).toBeVisible();
  await exp.getByLabel("Data").fill("2026-09-01");
  await exp.getByRole("button", { name: "Salvează cheltuiala" }).click();
  await expectToast(page, "Cheltuiala a fost salvată.");

  // The front page report for September.
  await page.goto("/?luna=2026-09");
  const report = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Raportul lunii" }) });
  await expect(report).toContainText("Septembrie 2026");
  await expect(report).toContainText("6.450,00 RON"); // 6170 + 280
  await expect(report).toContainText("14.681,20 RON");
  await expect(report).toContainText("-8.231,20 RON");
  await expect(report.getByRole("img", { name: "Intrări pe canale" })).toBeVisible();

  // Month selector: August is empty.
  await report.getByRole("link", { name: "Luna anterioară" }).click();
  await expect(report).toContainText("August 2026");
  await expect(report).toContainText("Nicio intrare în august 2026.");

  // Reports page and CSV export for September.
  await page.goto("/rapoarte?luna=2026-09");
  await expect(page.getByText("Rezultat estimat")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Descarcă CSV" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("marfa-raport-2026-09.csv");
});

test("deleting an income removes it from the month", async ({ page }) => {
  await adminSession(page);
  await page.goto("/incasari?luna=2026-09&nou=online");
  const sale = page.getByRole("dialog", { name: "Vânzare" });
  await sale.getByText("Clienți direcți").click();
  await sale.getByLabel("Ce ai vândut").fill("Bicicletă");
  await sale.getByLabel("Preț").fill("750");
  await sale.getByLabel("Data").fill("2026-09-30");
  await sale.getByRole("button", { name: "Salvează vânzarea" }).click();
  await expectToast(page, "Vânzarea a fost salvată.");

  await page.getByRole("button", { name: /Șterge încasarea „Bicicletă”/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Șterge" }).click();
  await expectToast(page, "Încasarea a fost ștearsă.");
  await expect(page.getByText("Nicio încasare în septembrie 2026.")).toBeVisible();
});
