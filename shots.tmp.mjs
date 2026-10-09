import { chromium } from "@playwright/test";
const [out, ...paths] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [name, vp] of [["desktop", { width: 1280, height: 800 }], ["mobil", { width: 390, height: 844 }]]) {
  const p = await b.newPage({ viewport: vp, locale: "ro-RO" });
  const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => m.type() === "error" && errs.push(m.text().slice(0, 200)));
  await p.goto("http://localhost:3000/login");
  await p.getByLabel("Email").fill("gabi@demo.local");
  await p.getByLabel("Parolă").fill("Demo-parola-2026");
  await p.getByRole("button", { name: "Intră în cont" }).click();
  await p.waitForURL(u => !u.pathname.startsWith("/login"));
  for (const path of paths) {
    await p.goto("http://localhost:3000" + path); await p.waitForLoadState("networkidle"); await p.waitForTimeout(300);
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    await p.screenshot({ path: `${out}/${path.replace(/\W+/g, "_")}-${name}.png`, fullPage: true });
    console.log(name, path, "scrollWidth", sw);
  }
  console.log(name, "errors", errs);
}
await b.close();
