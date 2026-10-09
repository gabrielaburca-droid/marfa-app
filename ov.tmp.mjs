import { chromium } from "@playwright/test";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, locale: "ro-RO" });
await p.goto("http://localhost:3000/login");
await p.getByLabel("Email").fill("gabi@demo.local"); await p.getByLabel("Parolă").fill("Demo-parola-2026");
await p.getByRole("button", { name: "Intră în cont" }).click(); await p.waitForURL(u => !u.pathname.startsWith("/login"));
for (const path of process.argv.slice(2)) {
  await p.goto("http://localhost:3000" + path); await p.waitForLoadState("networkidle");
  console.log(path, await p.evaluate(() => document.documentElement.scrollWidth));
  console.log(await p.evaluate(() => [...document.querySelectorAll("body *")].filter(e => e.getBoundingClientRect().right > 392).slice(0, 6).map(e => e.tagName + "." + String(e.className).slice(0, 80) + " r=" + Math.round(e.getBoundingClientRect().right))));
}
await b.close();
