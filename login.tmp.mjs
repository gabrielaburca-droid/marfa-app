import { chromium } from "@playwright/test";
const out = process.argv[2];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [n, vp] of [["desktop", { width: 1280, height: 800 }], ["mobil", { width: 390, height: 844 }]]) {
  const p = await b.newPage({ viewport: vp, locale: "ro-RO" });
  await p.goto("http://localhost:3000/login"); await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/login-${n}.png` });
}
await b.close();
