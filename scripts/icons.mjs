#!/usr/bin/env node
// Renders the PNG icons from public/favicon.svg, run by hand after the favicon changes.
// The rounded icons are the favicon as drawn. Android's maskable icon and iOS's touch icon
// are cut by the system, so they take a square berry ground with the cards inside the
// maskable safe circle (80 % of the width).
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const svg = readFileSync("public/favicon.svg", "utf8");
const cards = svg.match(/<g id="cards">[\s\S]*?<\/g>/)[0];
const ground = svg.match(/fill="(#[0-9a-f]{6})"/)[1];
const square = (scale) => {
  const offset = (512 * (1 - scale)) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${ground}"/><g transform="translate(${offset} ${offset}) scale(${scale})">${cards}</g></svg>`;
};

const icons = [
  ["public/pwa-192.png", 192, svg],
  ["public/pwa-512.png", 512, svg],
  ["public/pwa-maskable-512.png", 512, square(0.78)],
  ["public/apple-touch-icon.png", 180, square(0.9)],
];

const browser = await chromium.launch();
for (const [path, size, source] of icons) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const body = source.replace("<svg ", `<svg width="${size}" height="${size}" `);
  await page.setContent(`<body style="margin:0;background:transparent">${body}</body>`);
  await page.screenshot({ path, omitBackground: true });
  await page.close();
}
await browser.close();
