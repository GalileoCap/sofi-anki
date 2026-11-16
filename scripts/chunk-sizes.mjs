#!/usr/bin/env node
// Every script the build writes stays under 500 kB, the limit Vite warns at, except Mermaid's
// chunks: they load only when a card holds a diagram, and some are single modules too large to
// split (elkjs, Mermaid's parser). Vite's own limit sits above them, and this holds the rest.
import { readdirSync, statSync } from "node:fs";

const LIMIT_KB = 500;
const dir = "dist/assets";
const over = readdirSync(dir)
  .filter((name) => name.endsWith(".js") && !name.startsWith("diagram-"))
  .map((name) => ({ name, kb: statSync(`${dir}/${name}`).size / 1000 }))
  .filter(({ kb }) => kb > LIMIT_KB);

for (const { name, kb } of over) console.error(`${name} is ${kb.toFixed(0)} kB, over ${LIMIT_KB} kB`);
if (over.length > 0) process.exit(1);
console.log(`chunks: all under ${LIMIT_KB} kB but the diagram's`);
