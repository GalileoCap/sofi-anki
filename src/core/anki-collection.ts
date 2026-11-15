/**
 * The metadata an exported `.apkg` carries in its `col` row: one Basic note type with a Front and a
 * Back field, the deck, and Anki's default options. Anki 2.1 reads a file with these values.
 */

export const ANKI_SCHEMA = `
  CREATE TABLE col (
    id integer primary key, crt integer not null, mod integer not null,
    scm integer not null, ver integer not null, dty integer not null,
    usn integer not null, ls integer not null, conf text not null,
    models text not null, decks text not null, dconf text not null, tags text not null
  );
  CREATE TABLE notes (
    id integer primary key, guid text not null, mid integer not null,
    mod integer not null, usn integer not null, tags text not null,
    flds text not null, sfld text not null, csum integer not null,
    flags integer not null, data text not null
  );
  CREATE TABLE cards (
    id integer primary key, nid integer not null, did integer not null,
    ord integer not null, mod integer not null, usn integer not null,
    type integer not null, queue integer not null, due integer not null,
    ivl integer not null, factor integer not null, reps integer not null,
    lapses integer not null, left integer not null, odue integer not null,
    odid integer not null, flags integer not null, data text not null
  );
  CREATE TABLE revlog (
    id integer primary key, cid integer not null, usn integer not null,
    ease integer not null, ivl integer not null, lastIvl integer not null,
    factor integer not null, time integer not null, type integer not null
  );
  CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);
`;

const LATEX_PRE =
  "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n";

const deckEntry = (id: number, name: string, nowSec: number) => ({
  id,
  name,
  conf: 1,
  extendNew: 10,
  extendRev: 50,
  usn: 0,
  collapsed: false,
  newToday: [0, 0],
  revToday: [0, 0],
  lrnToday: [0, 0],
  timeToday: [0, 0],
  dyn: 0,
  desc: "",
  mod: nowSec,
});

/** The ids an export gives its note type and its deck, from the moment of export in seconds. */
export const exportIds = (nowSec: number) => ({ modelId: nowSec, deckId: nowSec + 1 });

/** The values of the `col` row for one deck titled `title`, exported at `nowSec`. */
export function collectionRow(title: string, created: number, nowSec: number): (string | number)[] {
  const { modelId, deckId } = exportIds(nowSec);
  const models = {
    [modelId]: {
      id: modelId,
      name: "Basic",
      type: 0,
      mod: nowSec,
      usn: -1,
      sortf: 0,
      did: deckId,
      tmpls: [
        {
          name: "Card 1",
          ord: 0,
          qfmt: "{{Front}}",
          afmt: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}",
          bqfmt: "",
          bafmt: "",
          did: null,
          bfont: "",
          bsize: 0,
        },
      ],
      flds: [
        { name: "Front", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
        { name: "Back", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
      ],
      css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }",
      latexPre: LATEX_PRE,
      latexPost: "\\end{document}",
      latexsvg: false,
      req: [[0, "any", [0]]],
      tags: [],
      vers: [],
    },
  };
  const decks = { 1: deckEntry(1, "Default", nowSec), [deckId]: deckEntry(deckId, title, nowSec) };
  const dconf = {
    1: {
      id: 1,
      name: "Default",
      replayq: true,
      timer: 0,
      maxTaken: 60,
      usn: 0,
      mod: 0,
      autoplay: true,
      lapse: { delays: [10], mult: 0, minInt: 1, leechFails: 8, leechAction: 0 },
      rev: { perDay: 100, ease4: 1.3, fuzz: 0.05, minSpace: 1, ivlFct: 1, maxIvl: 36500, bury: false, hardFactor: 1.2 },
      new: { perDay: 20, delays: [1, 10], separate: true, ints: [1, 4, 7], initialFactor: 2500, bury: false, order: 1 },
    },
  };
  const conf = {
    activeDecks: [deckId],
    curDeck: deckId,
    newSpread: 0,
    collapseTime: 1200,
    timeLim: 0,
    estTimes: true,
    dueCounts: true,
    curModel: String(modelId),
    nextPos: 1,
    sortType: "noteFld",
    sortBackwards: false,
    addToCur: true,
    dayLearnFirst: false,
    schedVer: 2,
  };
  return [
    1,
    created,
    nowSec,
    nowSec,
    11,
    0,
    -1,
    0,
    JSON.stringify(conf),
    JSON.stringify(models),
    JSON.stringify(decks),
    JSON.stringify(dconf),
    "{}",
  ];
}
