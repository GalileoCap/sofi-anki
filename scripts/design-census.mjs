#!/usr/bin/env node
// The census of the static design gate (T3 of docs/design-research.md): how many distinct
// colours, type sizes, families, radii and shadows the built stylesheet can paint, held to the
// budgets in the `design` block of .claude/claude-kit.json. A count over its budget fails, and a
// count under it fails too, so the budget is lowered and the gain is kept.
import { analyze } from "@projectwallace/css-analyzer";
import { readFileSync, readdirSync } from "node:fs";

const config = JSON.parse(readFileSync(".claude/claude-kit.json", "utf8")).design;
const css = readdirSync(config.css)
  .filter((name) => name.endsWith(".css"))
  .map((name) => readFileSync(`${config.css}/${name}`, "utf8"))
  .join("\n");

/** Every value each custom property is given, in any theme. */
const declared = new Map();
for (const [, name, value] of css.matchAll(/(--[\w-]+):([^;}]+)/g)) {
  declared.set(name, [...(declared.get(name) ?? []), value.trim()]);
}

/** The literal values a value can stand for, following `var()` through the declarations. */
function resolve(value, seen = new Set()) {
  const reference = value.match(/^var\((--[\w-]+)(?:,(.*))?\)$/s);
  if (!reference) return [value];
  const [, name, fallback] = reference;
  if (seen.has(name)) return [];
  const values = declared.get(name) ?? (fallback ? [fallback.trim()] : []);
  return values.flatMap((each) => resolve(each, new Set([...seen, name])));
}

const unique = (values) => new Set(values.flatMap((value) => resolve(value)).filter((value) => value !== "initial")).size;
const report = analyze(css).values;
const counts = {
  colors: Object.keys(report.colors.unique).length,
  fontSizes: unique(Object.keys(report.fontSizes.unique)),
  fontFamilies: unique(Object.keys(report.fontFamilies.unique)),
  radii: unique(Object.keys(report.borderRadiuses.unique)),
  shadows: new Set(declared.get("--tw-shadow") ?? []).size,
};

let failed = false;
for (const [dimension, count] of Object.entries(counts)) {
  const budget = config.budgets[dimension];
  const verdict = count > budget ? "over" : count < budget ? "under" : "at";
  if (verdict !== "at") failed = true;
  console.log(`${dimension}: ${count}, budget ${budget} (${verdict})`);
}
if (failed) {
  console.error("The census differs from its budgets: remove what grew, or lower the budget to keep what shrank.");
  process.exit(1);
}
