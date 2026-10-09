import { expect, test, type Page } from "@playwright/test";
import { addMember, createBusiness, expectToast, latestEmailLink, login, newUser } from "./helpers";

async function adminSession(page: Page) {
  const biz = await createBusiness("Setări E2E");
  const admin = await newUser("admin-settings");
  await addMember(biz, admin.id, "admin");
  await login(page, admin.email);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  return { biz, admin };
}

test("business details are saved", async ({ page }) => {
  await adminSession(page);
  await page.goto("/setari");
  await page.getByLabel("Nume afișat").fill("Marfa Test SRL");
  await page.getByLabel("CUI").fill("RO12345678");
  await page.getByLabel("PLN").check();
  await page.getByRole("button", { name: "Salvează" }).click();
  await expectToast(page, "Datele firmei au fost salvate.");
  await page.reload();
  await expect(page.getByLabel("CUI")).toHaveValue("RO12345678");
  await expect(page.getByLabel("PLN")).toBeChecked();
  await expect(page.locator("aside")).toContainText("Marfa Test SRL");
});

test("expense categories: add, rename, deactivate, reactivate", async ({ page }) => {
  await adminSession(page);
  await page.goto("/setari/categorii");
  const card = page.locator("section").filter({ hasText: "Categorii de cheltuieli" });
  await expect(card.getByText("Viniete", { exact: true })).toBeVisible();

  // Reorder: "Viniete" moves above "Taxe de drum".
  const names = () => card.getByRole("listitem").locator("[data-name]").allTextContents();
  expect((await names()).indexOf("Viniete")).toBe((await names()).indexOf("Taxe de drum") + 1);
  await card.getByRole("button", { name: "Mută Viniete mai sus" }).click();
  await expect.poll(async () => (await names()).indexOf("Viniete") < (await names()).indexOf("Taxe de drum")).toBe(true);

  await card.getByLabel("Nume").first().fill("Asigurare auto");
  await card.getByLabel("Grupă").first().selectOption({ label: "Transport, combustibil și import" });
  await card.getByRole("button", { name: "Adaugă categoria" }).click();
  await expectToast(page, "Elementul a fost adăugat.");
  const row = card.getByRole("listitem").filter({ hasText: "Asigurare auto" });
  await expect(row).toContainText("Transport, combustibil și import");

  // Same name twice is refused.
  await card.getByLabel("Nume").first().fill("asigurare auto");
  await card.getByLabel("Grupă").first().selectOption({ label: "Alte cheltuieli operaționale" });
  await card.getByRole("button", { name: "Adaugă categoria" }).click();
  await expectToast(page, "Există deja un element cu acest nume.");

  await row.getByRole("button", { name: "Editează" }).click();
  const editing = card.getByRole("listitem").filter({ has: page.getByRole("button", { name: "Renunță" }) });
  await editing.getByLabel("Nume").fill("Asigurare RCA");
  await editing.getByRole("button", { name: "Salvează" }).click();
  await expectToast(page, "Modificarea a fost salvată.");

  const renamed = card.getByRole("listitem").filter({ hasText: "Asigurare RCA" });
  await renamed.getByRole("button", { name: "Dezactivează" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Dezactivează" }).click();
  await expectToast(page, "Elementul a fost dezactivat.");
  await expect(renamed).toContainText("Inactiv");

  await renamed.getByRole("button", { name: "Reactivează" }).click();
  await expectToast(page, "Elementul a fost reactivat.");
  await expect(renamed).not.toContainText("Inactiv");
});

test("a new market channel is linked to its location", async ({ page }) => {
  await adminSession(page);
  await page.goto("/setari/canale");
  const locations = page.locator("section").filter({ hasText: "Locații târguri" });
  await locations.getByLabel("Nume").first().fill("Târg Iași");
  await locations.getByLabel("Oraș").first().fill("Iași");
  await locations.getByRole("button", { name: "Adaugă locația" }).click();
  await expectToast(page, "Elementul a fost adăugat.");

  const channels = page.locator("section").filter({ hasText: "Canale de vânzare" });
  await channels.getByLabel("Nume").first().fill("Târg Iași");
  await channels.getByLabel("Tip").first().selectOption({ label: "Târg (fizic)" });
  await channels.getByLabel("Locație (pentru târg)").first().selectOption({ label: "Târg Iași" });
  await channels.getByRole("button", { name: "Adaugă canalul" }).click();
  await expectToast(page, "Elementul a fost adăugat.");
  await expect(channels.getByRole("listitem").filter({ hasText: "Târg Iași" })).toContainText(
    "Târg (fizic) · Târg Iași",
  );
});

test("exchange rates are saved exactly and can be deleted", async ({ page }) => {
  await adminSession(page);
  await page.goto("/setari/cursuri");
  await page.getByLabel("Valută").selectOption("EUR");
  await page.getByLabel("Data").fill("2026-10-08");
  await page.getByLabel("Lei pentru 1 unitate").fill("4,976712");
  await page.getByRole("button", { name: "Salvează cursul" }).click();
  await expectToast(page, "Cursul EUR a fost salvat.");
  const row = page.getByRole("row").filter({ hasText: "08.10.2026" });
  await expect(row).toContainText("4,976712");

  await page.getByLabel("Lei pentru 1 unitate").fill("abc");
  await page.getByRole("button", { name: "Salvează cursul" }).click();
  await expect(page.getByText("Cursul nu este un număr valid.")).toBeVisible();

  await row.getByRole("button", { name: "Șterge" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Șterge" }).click();
  await expectToast(page, "Cursul a fost șters.");
  await expect(page.getByRole("row").filter({ hasText: "08.10.2026" })).toHaveCount(0);
});

test("invite an operator, who sets a password; deactivation blocks login; history shows it", async ({
  page,
  browser,
}) => {
  await adminSession(page);
  const email = `operator-invite-${Date.now()}@test.local`;

  await page.goto("/setari/utilizatori");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Nume").fill("Maria Operator");
  await page.getByRole("button", { name: "Trimite invitația" }).click();
  await expectToast(page, `Invitația a fost trimisă la ${email}.`);
  const row = page.getByRole("listitem").filter({ hasText: "Maria Operator" });
  await expect(row).toContainText("Invitat");

  // The invited person accepts from the email.
  const operator = await browser.newPage();
  await operator.goto(await latestEmailLink(email));
  await expect(operator).toHaveURL(/\/reset-password$/);
  await operator.getByLabel("Parolă nouă").fill("Parola-Maria-2026");
  await operator.getByLabel("Confirmați parola").fill("Parola-Maria-2026");
  await operator.getByRole("button", { name: "Salvează parola" }).click();
  await expect(operator.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  const nav = operator.getByRole("navigation", { name: "Navigare principală" }).first();
  await expect(nav.getByRole("link", { name: "Setări" })).toHaveCount(0);
  await operator.goto("/setari/utilizatori");
  await expect(operator).toHaveURL(/eroare=acces/);

  // Admin grants report access, then deactivates.
  await page.reload();
  await expect(row).toContainText("Activ");
  await row.getByLabel("Vede rapoarte").check();
  await expectToast(page, "Drepturile au fost actualizate.");
  await row.getByRole("button", { name: "Dezactivează" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Dezactivează" }).click();
  await expectToast(page, "Utilizatorul a fost dezactivat.");
  await expect(row).toContainText("Dezactivat");

  // The existing session loses access and new logins are refused.
  await operator.goto("/");
  await expect(operator).toHaveURL(/\/(login|auth\/no-access)$/);
  await login(operator, email, "Parola-Maria-2026");
  await expect(operator.getByRole("alert").filter({ hasText: "Email sau parolă incorectă." })).toBeVisible();

  // Reactivated, the operator can sign in again.
  await row.getByRole("button", { name: "Reactivează" }).click();
  await expectToast(page, "Utilizatorul a fost reactivat.");
  await login(operator, email, "Parola-Maria-2026");
  await expect(operator.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Rapoarte" })).toBeVisible();

  // The admin cannot deactivate or demote themselves.
  const self = page.getByRole("listitem").filter({ hasText: "(dvs.)" });
  await expect(self.getByRole("button", { name: "Dezactivează" })).toHaveCount(0);
  await expect(self.getByRole("combobox")).toBeDisabled();

  await page.goto("/setari/istoric");
  const history = page.getByRole("row").filter({ hasText: "Utilizator" });
  await expect(history.filter({ hasText: "activ: da → nu" })).toHaveCount(1);
  await expect(history.first()).toContainText("admin-settings");
});

test("operators cannot open any settings page", async ({ page }) => {
  const biz = await createBusiness("Setări E2E");
  const op = await newUser("operator-settings");
  await addMember(biz, op.id, "operator", true);
  await login(page, op.email);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  for (const path of [
    "/setari",
    "/setari/utilizatori",
    "/setari/categorii",
    "/setari/canale",
    "/setari/cursuri",
    "/setari/istoric",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/eroare=acces/);
  }
});
