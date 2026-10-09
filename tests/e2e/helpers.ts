import { config } from "dotenv";
import { expect, type Page } from "@playwright/test";
import { addMember, createBusiness, PASSWORD, serviceClient } from "../db/helpers";

config({ path: ".env.local", quiet: true });

export { addMember, createBusiness, PASSWORD };

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

export async function newUser(label: string) {
  const email = `${label}-${Date.now()}@test.local`;
  const { data, error } = await serviceClient().auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: label },
  });
  if (error) throw error;
  return { id: data.user.id, email };
}

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Parolă").fill(password);
  await page.getByRole("button", { name: "Intră în cont" }).click();
}

export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.locator("[role=status], [role=alert]").filter({ hasText: text }).first()).toBeVisible();
}

export async function latestEmailLink(to: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`);
    const { messages } = (await res.json()) as { messages: { ID: string }[] };
    if (messages?.length) {
      const msg = await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json();
      const href = /href="([^"]+)"/.exec(msg.HTML as string)?.[1];
      if (href) return href.replaceAll("&amp;", "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No email for ${to}`);
}

/** Sign out through the profile menu in the top bar. */
export async function logout(page: Page) {
  await page.getByRole("button", { name: "Contul meu" }).click();
  await page.getByRole("button", { name: "Ieșire din cont" }).click();
  await expect(page).toHaveURL(/\/login$/);
}
