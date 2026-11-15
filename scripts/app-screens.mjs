// The app's screens for the rendered audit (T4), each reached from a fresh load of the demo
// store by the clicks a person would make. `pnpm design:audit <url> --walk scripts/app-screens.mjs`
// audits each at phone and laptop width, in light and dark mode.

const deckTitle = "JavaScript Fundamentals";
const click = (page, role, name) => page.getByRole(role, { name, exact: false }).first().click();
const openDeck = (page) => click(page, "button", deckTitle);
const homeMenu = async (page, item) => {
  await click(page, "button", /^More$/);
  await click(page, "menuitem", item);
};
const deckMenu = async (page, item) => {
  await openDeck(page);
  await click(page, "button", /^More$/);
  await click(page, "menuitem", item);
};
const startStudy = (page) => click(page, "button", /^Study \d+ cards?/);

export const screens = [
  { name: "home", go: async () => {} },
  { name: "home, new deck", go: (page) => click(page, "button", /^New deck$/) },
  { name: "home, daily goal", go: (page) => homeMenu(page, "Daily goal") },
  { name: "home, back up and restore", go: (page) => homeMenu(page, "Back up and restore") },
  { name: "home, bring in from Anki", go: (page) => homeMenu(page, "Bring in from Anki") },
  { name: "home, bring in a JSON file", go: (page) => homeMenu(page, "Bring in a JSON file") },
  { name: "stats", go: (page) => click(page, "button", /^Stats$/) },
  { name: "deck", go: openDeck },
  {
    name: "deck, add a card",
    go: async (page) => {
      await openDeck(page);
      await click(page, "button", /^Add a card$/);
    },
  },
  {
    name: "deck, choose cards",
    go: async (page) => {
      await openDeck(page);
      await click(page, "button", /^Choose cards to study$/);
    },
  },
  { name: "deck, export a file", go: (page) => deckMenu(page, "Export a file") },
  {
    name: "deck stats",
    go: async (page) => {
      await openDeck(page);
      await click(page, "button", /^Stats$/);
    },
  },
  { name: "study, question", go: startStudy },
  {
    name: "study, answer",
    go: async (page) => {
      await startStudy(page);
      await click(page, "button", /^(Show the answer|Check)/);
    },
  },
  {
    name: "run end",
    go: async (page) => {
      await startStudy(page);
      const grades = ["1", "2", "3"];
      for (let i = 0; i < 60 && !(await page.getByRole("heading", { name: /cards? studied/ }).count()); i++) {
        const option = page.locator("main button[aria-pressed]:not([disabled])").first();
        if (await option.count()) await option.click();
        await page.keyboard.press("Space");
        await page.keyboard.press(grades[i % 3]);
        await page.waitForTimeout(50);
      }
    },
  },
  {
    name: "shared deck",
    go: async (page) => {
      await openDeck(page);
      await click(page, "button", /^Share a link$/);
      const link = await page.evaluate(() => navigator.clipboard.readText());
      await page.evaluate(() => localStorage.clear());
      await page.goto(link);
    },
  },
];
