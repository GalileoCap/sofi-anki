#!/usr/bin/env node
// The rendered audit (T4 of docs/design-research.md). It opens a page in Chromium, takes each
// element matching the screen selector as one screen, and in light and dark mode reports, per
// screen: axe violations (contrast first), touch targets under 44 px on a phone screen (fl-3),
// text under 12 px and phone body text under 16 px (type-5), boxes that overflow (fl-5), and a
// census of the font sizes, colours, radii and shadows painted. Full-size screenshots go to a
// new scratch directory. It exits 1 when axe reports a violation and 0 otherwise.
//
//   node scripts/design-audit.mjs <page> [--screens <selector>] [--phone <selector>] [--dark <js>]
//
// <page> is a URL or a file path. The defaults fit the mocks: screens are `.device`, a phone
// screen is `.device.phone`, and dark mode adds `dark` to every `.theme`.
import { AxeBuilder } from "@axe-core/playwright";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    screens: { type: "string", default: ".device" },
    phone: { type: "string", default: ".device.phone" },
    dark: { type: "string", default: 'document.querySelectorAll(".theme").forEach((e) => e.classList.add("dark"))' },
  },
});
if (positionals.length !== 1) {
  console.error("usage: design-audit.mjs <page> [--screens <selector>] [--phone <selector>] [--dark <js>]");
  process.exit(2);
}
const target = /^https?:/.test(positionals[0]) ? positionals[0] : pathToFileURL(resolve(positionals[0])).href;
const out = mkdtempSync(join(tmpdir(), "design-audit-"));

/** What the DOM can show about one screen: its targets, small text, overflow and the values painted. */
function inspect(screen, isPhone) {
  const box = screen.getBoundingClientRect();
  const label = (e) => (e.getAttribute("aria-label") || e.textContent || e.tagName).trim().replace(/\s+/g, " ").slice(0, 50);
  const visible = (e) => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden";
  };
  const all = [...screen.querySelectorAll("*")].filter(visible);

  const targets = isPhone
    ? all
        .filter((e) => e.matches("button, a[href], input, select, textarea, [role=button], [tabindex]:not([tabindex='-1'])"))
        .map((e) => ({ e, r: e.getBoundingClientRect() }))
        .filter(({ r }) => r.width < 44 || r.height < 44)
        .map(({ e, r }) => `${label(e)} (${Math.round(r.width)} x ${Math.round(r.height)})`)
    : [];

  const textOf = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const small = [];
  const smallBody = [];
  for (const e of all.filter(textOf)) {
    const size = parseFloat(getComputedStyle(e).fontSize);
    if (size < 12) small.push(`${label(e)} (${size} px)`);
    else if (isPhone && size < 16 && e.matches("p, li") && e.textContent.length > 80) smallBody.push(`${label(e)} (${size} px)`);
  }

  const overflow = [];
  const scrolls = [];
  for (const e of all) {
    const style = getComputedStyle(e);
    // A field scrolls its own text, and an ellipsis announces the cut, so neither is overflow.
    const announced = e.matches("input, textarea") || (style.textOverflow === "ellipsis" && e.title);
    if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0 && !announced) {
      (["auto", "scroll"].includes(style.overflowX) ? scrolls : overflow).push(`${label(e)} (${e.scrollWidth} in ${e.clientWidth})`);
    }
    const r = e.getBoundingClientRect();
    if (r.right > box.right + 1 || r.left < box.left - 1) overflow.push(`${label(e)} leaves the screen`);
  }

  const census = { fontSizes: new Set(), colors: new Set(), radii: new Set(), shadows: new Set() };
  for (const e of all) {
    const s = getComputedStyle(e);
    if (textOf(e)) {
      census.fontSizes.add(s.fontSize);
      census.colors.add(s.color);
    }
    if (s.backgroundColor !== "rgba(0, 0, 0, 0)") census.colors.add(s.backgroundColor);
    if (parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== "none") census.colors.add(s.borderTopColor);
    if (s.borderTopLeftRadius !== "0px") census.radii.add(s.borderTopLeftRadius);
    if (s.boxShadow !== "none") census.shadows.add(s.boxShadow);
  }
  const counts = Object.fromEntries(Object.entries(census).map(([k, v]) => [k, [...v].sort()]));
  return { targets, small, smallBody, overflow: [...new Set(overflow)], scrolls, census: counts };
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const page = await context.newPage();
const results = [];
let violations = 0;

for (const mode of ["light", "dark"]) {
  await page.goto(target, { waitUntil: "networkidle" });
  if (mode === "dark") await page.evaluate(values.dark);
  await page.evaluate(() => document.fonts.ready);
  const screens = await page.locator(values.screens).all();
  for (const [i, screen] of screens.entries()) {
    await screen.evaluate((e, id) => e.setAttribute("data-audit", id), String(i));
    const name = await screen.evaluate((e) => e.parentElement?.querySelector(":scope > p")?.textContent?.trim() ?? "");
    const isPhone = await screen.evaluate((e, sel) => e.matches(sel), values.phone);
    const axe = await new AxeBuilder({ page })
      .include(`[data-audit="${i}"]`)
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    const found = axe.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map((n) => `${n.target.join(" ")}: ${n.failureSummary?.split("\n").slice(1).join(" ").trim()}`),
    }));
    violations += found.reduce((sum, v) => sum + v.nodes.length, 0);
    const dom = await screen.evaluate(inspect, isPhone);
    const shot = join(out, `${String(i).padStart(2, "0")}-${mode}.png`);
    await screen.screenshot({ path: shot });
    results.push({ screen: i, name, mode, phone: isPhone, shot, axe: found, ...dom });
  }
}
await browser.close();

writeFileSync(join(out, "report.json"), JSON.stringify(results, null, 2));
for (const r of results) {
  const lines = [
    ...r.axe.flatMap((v) => [`axe ${v.id} (${v.impact}): ${v.help}`, ...v.nodes.map((n) => `    ${n}`)]),
    ...r.targets.map((t) => `fl-3 target under 44 px: ${t}`),
    ...r.small.map((t) => `type-5 text under 12 px: ${t}`),
    ...r.smallBody.map((t) => `type-5 phone body under 16 px: ${t}`),
    ...r.overflow.map((t) => `fl-5 overflow: ${t}`),
    ...r.scrolls.map((t) => `scrolls sideways: ${t}`),
  ];
  const c = r.census;
  console.log(`\n[${r.screen}] ${r.mode} ${r.phone ? "phone" : "laptop"}: ${r.name}`);
  console.log(`  census: ${c.fontSizes.length} sizes, ${c.colors.length} colours, ${c.radii.length} radii, ${c.shadows.length} shadows`);
  for (const line of lines) console.log(`  ${line}`);
}
console.log(`\n${violations} axe violation nodes. Screenshots and report.json in ${out}`);
process.exit(violations > 0 ? 1 : 0);
