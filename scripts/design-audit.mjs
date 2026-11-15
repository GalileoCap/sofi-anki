#!/usr/bin/env node
// The rendered audit (T4 of docs/design-research.md). It opens a page in Chromium, takes each
// element matching the screen selector as one screen, and in light and dark mode reports, per
// screen: axe violations (contrast first), touch targets under 44 px on a phone screen (fl-3),
// text under 12 px and phone body text under 16 px (type-5), boxes that overflow (fl-5), and a
// census of the font sizes, colours, radii and shadows painted. Full-size screenshots go to a
// new scratch directory. It exits 1 when axe reports a violation and 0 otherwise.
//
//   node scripts/design-audit.mjs <page> [--screens <selector>] [--phone <selector>] [--dark <js>]
//   node scripts/design-audit.mjs <url> --walk <module>
//
// <page> is a URL or a file path. The defaults fit the mocks: screens are `.device`, a phone
// screen is `.device.phone`, and dark mode adds `dark` to every `.theme`. With `--walk`, the page
// is the running app: the module exports `screens`, each a name and the steps that reach it from
// a fresh load, and each is audited whole at 375 and 1280 px wide, with `anki-theme` set to the
// mode before the load.
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
    walk: { type: "string" },
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
        // A control inside its label is pressed anywhere on the label.
        .map((e) => ({ e, r: (e.closest("label") ?? e).getBoundingClientRect() }))
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
  // A field scrolls its own text, an ellipsis with the full text in its title announces the cut,
  // and text clipped for screen readers alone is never seen, so none of them, nor what they hold, is overflow.
  const announces = (e) => {
    const style = getComputedStyle(e);
    return e.matches("input, textarea") || (style.textOverflow === "ellipsis" && e.title) || style.clipPath !== "none" || style.clip !== "auto";
  };
  const announcedWithin = (e) => {
    for (let a = e; a && a !== screen.parentElement; a = a.parentElement) if (announces(a)) return true;
    return false;
  };
  // What a box that scrolls sideways holds is clipped to it, and the box itself is reported as scrolling.
  const scrolledWithin = (e) => {
    for (let a = e.parentElement; a && a !== screen.parentElement; a = a.parentElement) {
      if (["auto", "scroll"].includes(getComputedStyle(a).overflowX)) return true;
    }
    return false;
  };
  for (const e of all) {
    const style = getComputedStyle(e);
    const announced = announcedWithin(e);
    if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0 && !announced) {
      (["auto", "scroll"].includes(style.overflowX) ? scrolls : overflow).push(`${label(e)} (${e.scrollWidth} in ${e.clientWidth})`);
    }
    const r = e.getBoundingClientRect();
    if (!announced && !scrolledWithin(e) && (r.right > box.right + 1 || r.left < box.left - 1)) overflow.push(`${label(e)} leaves the screen`);
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
const results = [];
let violations = 0;

/** Audits one screen, the element `screen`, and keeps its result and screenshot. */
async function audit(page, screen, { id, name, mode, isPhone, whole }) {
  await page.evaluate(() => document.fonts.ready);
  await screen.evaluate((e, i) => e.setAttribute("data-audit", i), id);
  const axe = await new AxeBuilder({ page })
    .include(`[data-audit="${id}"]`)
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
  const shot = join(out, `${id}-${mode}.png`);
  // A whole page is shot as the viewport shows it, since a dialog is fixed over a body that may be shorter.
  await (whole ? page.screenshot({ path: shot, fullPage: true }) : screen.screenshot({ path: shot }));
  results.push({ screen: id, name, mode, phone: isPhone, shot, axe: found, ...dom });
}

if (values.walk) {
  const { screens } = await import(pathToFileURL(resolve(values.walk)).href);
  const sizes = [
    { device: "phone", viewport: { width: 375, height: 812 } },
    { device: "laptop", viewport: { width: 1280, height: 800 } },
  ];
  for (const { device, viewport } of sizes) {
    for (const mode of ["light", "dark"]) {
      for (const [i, { name, go }] of screens.entries()) {
        const context = await browser.newContext({ viewport, deviceScaleFactor: 2, permissions: ["clipboard-read", "clipboard-write"] });
        await context.addInitScript((theme) => localStorage.setItem("anki-theme", theme), mode);
        const page = await context.newPage();
        await page.goto(target, { waitUntil: "networkidle" });
        await go(page);
        await page.waitForTimeout(300);
        // The viewport takes the page's height, so a sticky bar is drawn at the page's foot, below the content.
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.setViewportSize({ width: viewport.width, height: Math.max(viewport.height, height) });
        // A dialog or menu renders outside the root, so the screen is the body.
        await audit(page, page.locator("body"), { id: `${device}-${String(i).padStart(2, "0")}`, name, mode, isPhone: device === "phone", whole: true });
        await context.close();
      }
    }
  }
} else {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  for (const mode of ["light", "dark"]) {
    await page.goto(target, { waitUntil: "networkidle" });
    if (mode === "dark") await page.evaluate(values.dark);
    const screens = await page.locator(values.screens).all();
    for (const [i, screen] of screens.entries()) {
      const name = await screen.evaluate((e) => e.parentElement?.querySelector(":scope > p")?.textContent?.trim() ?? "");
      const isPhone = await screen.evaluate((e, sel) => e.matches(sel), values.phone);
      await audit(page, screen, { id: String(i).padStart(2, "0"), name, mode, isPhone });
    }
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
