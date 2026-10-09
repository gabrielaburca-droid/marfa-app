import { expect, test } from "@playwright/test";
import { addMember, createBusiness, latestEmailLink, login, newUser, PASSWORD } from "./helpers";

test("anonymous visitors are sent to the login page", async ({ page }) => {
  for (const path of ["/", "/incasari", "/cheltuieli", "/rapoarte", "/setari"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
});

test("admin logs in, sees the full navigation and logs out", async ({ page }) => {
  const biz = await createBusiness("Firma E2E");
  const admin = await newUser("admin-e2e");
  await addMember(biz, admin.id, "admin");

  await login(page, admin.email, "parola-gresita-1");
  await expect(page.getByRole("alert").filter({ hasText: "Email sau parolă incorectă." })).toBeVisible();

  await login(page, admin.email);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Navigare principală" }).first();
  for (const label of ["Dashboard", "Încasări", "Cheltuieli", "Rapoarte", "Setări"]) {
    await expect(nav.getByRole("link", { name: label })).toBeVisible();
  }

  await page.getByRole("button", { name: "Ieșire din cont" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("operators do not see or reach admin-only pages", async ({ page }) => {
  const biz = await createBusiness("Firma E2E");
  const operator = await newUser("operator-e2e");
  await addMember(biz, operator.id, "operator");

  await login(page, operator.email);
  const nav = page.getByRole("navigation", { name: "Navigare principală" }).first();
  await expect(nav.getByRole("link", { name: "Încasări" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Setări" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Rapoarte" })).toHaveCount(0);

  await page.goto("/setari");
  await expect(page).toHaveURL(/eroare=acces/);
  await expect(page.getByRole("alert").filter({ hasText: "Nu aveți acces la pagina cerută." })).toBeVisible();
});

test("a user without an active membership is told they have no access", async ({ page }) => {
  const loner = await newUser("loner-e2e");
  await login(page, loner.email);
  await expect(page).toHaveURL(/\/auth\/no-access$/);
  await expect(page.getByRole("heading", { name: "Contul nu are acces" })).toBeVisible();
});

test("password reset by email", async ({ page }) => {
  const biz = await createBusiness("Firma E2E");
  const user = await newUser("reset-e2e");
  await addMember(biz, user.id, "operator");

  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(user.email);
  await page.getByRole("button", { name: "Trimite linkul" }).click();
  await expect(page.getByRole("status")).toContainText("veți primi un email");

  await page.goto(await latestEmailLink(user.email));
  await expect(page).toHaveURL(/\/reset-password$/);
  const newPassword = "Parola-noua-2026";
  await page.getByLabel("Parolă nouă").fill(newPassword);
  await page.getByLabel("Confirmați parola").fill(newPassword);
  await page.getByRole("button", { name: "Salvează parola" }).click();
  await expect(page.getByText("Parola a fost salvată.")).toBeVisible();

  await page.getByRole("button", { name: "Ieșire din cont" }).click();
  await login(page, user.email, PASSWORD);
  await expect(page.getByRole("alert").filter({ hasText: "Email sau parolă incorectă." })).toBeVisible();
  await login(page, user.email, newPassword);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
