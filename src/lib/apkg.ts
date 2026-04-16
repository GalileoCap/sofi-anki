import { unzipSync, zipSync } from 'fflate';
import initSqlJs from 'sql.js';
import sqlWasm from 'sql.js/dist/sql-wasm.wasm?url';
import TurndownService from 'turndown';
import { marked } from 'marked';
import type { CardSRS, Deck, StandardCard } from '@/types';

const FIELD_SEP = '\x1f';

// Cache the sql.js instance so we only load WASM once
let _sqlJs: Awaited<ReturnType<typeof initSqlJs>> | null = null;
async function getSqlJs() {
  if (!_sqlJs) _sqlJs = await initSqlJs({ locateFile: () => sqlWasm });
  return _sqlJs;
}

// ── HTML ↔ Markdown ───────────────────────────────────────────────────────────

const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });

function htmlToMarkdown(html: string): string {
  return turndown.turndown(html).trim();
}

function markdownToHtml(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

function ankiTagsToArray(raw: string): string[] {
  return raw.trim().split(/\s+/).filter(Boolean);
}

function complexityFromLapses(lapses: number): 'easy' | 'medium' | 'hard' {
  if (lapses <= 3) return 'medium';
  return 'hard';
}

// ── Template rendering ────────────────────────────────────────────────────────

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderTemplate(tpl: string, fields: Record<string, string>): string {
  let out = tpl;
  // Positive conditionals {{#Field}}…{{/Field}}
  out = out.replace(/\{\{#([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, f, body) =>
    (fields[f.trim()] ?? '').length > 0 ? body : '',
  );
  // Negative conditionals {{^Field}}…{{/Field}}
  out = out.replace(/\{\{\^([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, f, body) =>
    (fields[f.trim()] ?? '').length === 0 ? body : '',
  );
  // Field substitutions
  for (const [name, value] of Object.entries(fields)) {
    out = out.replace(new RegExp(`\\{\\{${escapeRe(name)}\\}\\}`, 'gi'), value);
  }
  // Remove leftover mustaches
  out = out.replace(/\{\{[^}]+\}\}/g, '');
  return out;
}

// ── Schema parsers ────────────────────────────────────────────────────────────

interface NoteType {
  id: number;
  isCloze: boolean;
  fields: string[];
  templates: { ord: number; qfmt: string; afmt: string }[];
}

type DB = InstanceType<Awaited<ReturnType<typeof initSqlJs>>['Database']>;

function parseNoteTypes(db: DB, modelsJson: string | null): Map<number, NoteType> {
  const out = new Map<number, NoteType>();

  // Old format: col.models JSON
  if (modelsJson && modelsJson.trim().length > 2) {
    try {
      const models = JSON.parse(modelsJson) as Record<string, {
        id: number; type?: number;
        flds: { name: string; ord: number }[];
        tmpls: { ord: number; qfmt: string; afmt: string }[];
      }>;
      for (const m of Object.values(models)) {
        out.set(Number(m.id), {
          id: Number(m.id),
          isCloze: m.type === 1,
          fields: [...m.flds].sort((a, b) => a.ord - b.ord).map(f => f.name),
          templates: [...m.tmpls].sort((a, b) => a.ord - b.ord),
        });
      }
      if (out.size > 0) return out;
    } catch { /* fall through */ }
  }

  // Modern format (v16+): notetypes + fields tables (templates config is Protobuf, so we
  // synthesize simple front/back templates from the first two field names)
  try {
    const ntRows = db.exec('SELECT id, name FROM notetypes');
    const fieldRows = db.exec('SELECT ntid, ord, name FROM fields ORDER BY ntid, ord');
    const fieldsByNt = new Map<number, string[]>();
    if (fieldRows[0]) {
      for (const row of fieldRows[0].values) {
        const ntid = Number(row[0]);
        fieldsByNt.set(ntid, [...(fieldsByNt.get(ntid) ?? []), String(row[2])]);
      }
    }
    if (ntRows[0]) {
      for (const row of ntRows[0].values) {
        const id = Number(row[0]);
        const fs = fieldsByNt.get(id) ?? [];
        out.set(id, {
          id,
          isCloze: false,
          fields: fs,
          templates: [{
            ord: 0,
            qfmt: fs[0] ? `{{${fs[0]}}}` : '',
            afmt: fs[1] ? `{{${fs[1]}}}` : '',
          }],
        });
      }
    }
  } catch { /* ignore */ }

  return out;
}

function parseDeckNames(db: DB, decksJson: string | null): Map<number, string> {
  const out = new Map<number, string>();

  // Old format: col.decks JSON
  if (decksJson && decksJson.trim().length > 2) {
    try {
      const decks = JSON.parse(decksJson) as Record<string, { id: number; name: string }>;
      for (const d of Object.values(decks)) out.set(Number(d.id), d.name);
      if (out.size > 0) return out;
    } catch { /* fall through */ }
  }

  // Modern format: decks table
  try {
    const rows = db.exec('SELECT id, name FROM decks');
    if (rows[0]) {
      for (const row of rows[0].values) out.set(Number(row[0]), String(row[1]));
    }
  } catch { /* ignore */ }

  return out;
}

// ── Export helpers ────────────────────────────────────────────────────────────

function fieldChecksum(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

// ── Public API ─────────────────────────────────────────────────────────────────

export interface ParsedApkg {
  decks: Deck[];
  srs: CardSRS[];
}

export async function parseApkg(file: File): Promise<ParsedApkg> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  let zip = unzipSync(buffer);

  // Handle double-packaging: a .zip wrapping an inner .apkg
  const innerApkg = Object.keys(zip).find(name => name.endsWith('.apkg'));
  if (innerApkg) zip = unzipSync(zip[innerApkg]);

  // Pick the database file (prefer newest)
  let dbBytes: Uint8Array;
  if (zip['collection.anki21b']) {
    const { decompress } = await import('fzstd');
    dbBytes = decompress(zip['collection.anki21b']);
  } else if (zip['collection.anki21']) {
    dbBytes = zip['collection.anki21'];
  } else if (zip['collection.anki2']) {
    dbBytes = zip['collection.anki2'];
  } else {
    throw new Error('No Anki collection found in this file.');
  }

  const SQL = await getSqlJs();
  const db = new SQL.Database(dbBytes);

  try {
    const colRows = db.exec('SELECT crt, models, decks FROM col LIMIT 1');
    if (!colRows[0]?.values[0]) throw new Error('Invalid or empty Anki collection.');
    const crt = Number(colRows[0].values[0][0]);
    const modelsJson = colRows[0].values[0][1] as string | null;
    const decksJson = colRows[0].values[0][2] as string | null;

    const noteTypes = parseNoteTypes(db, modelsJson);
    const deckNames = parseDeckNames(db, decksJson);

    // Last review result per card from revlog
    const lastEase = new Map<number, number>();
    try {
      const revRows = db.exec(
        'SELECT cid, ease FROM revlog WHERE id IN (SELECT MAX(id) FROM revlog GROUP BY cid)',
      );
      if (revRows[0]) {
        for (const row of revRows[0].values) lastEase.set(Number(row[0]), Number(row[1]));
      }
    } catch { /* revlog may be empty */ }

    // Notes + cards
    const rows = db.exec(`
      SELECT n.id, n.mid, n.flds, n.tags,
             c.id, c.did, c.ord, c.queue, c.due, c.ivl, c.factor, c.lapses
      FROM notes n JOIN cards c ON n.id = c.nid
      ORDER BY c.did, n.id
    `);

    const importTs = Date.now();
    const deckIdMap = new Map<number, string>();
    const deckCards = new Map<number, StandardCard[]>();
    const deckSrsMap = new Map<number, CardSRS[]>();

    if (rows[0]) {
      for (const row of rows[0].values) {
        const nid = Number(row[0]);
        const mid = Number(row[1]);
        const flds = String(row[2]);
        const tags = String(row[3]);
        const cid = Number(row[4]);
        const did = Number(row[5]);
        const ord = Number(row[6]);
        const queue = Number(row[7]);
        const due = Number(row[8]);
        const ivl = Number(row[9]);
        const factor = Number(row[10]);
        const lapses = Number(row[11]);

        const nt = noteTypes.get(mid);
        if (!nt || nt.isCloze) continue;

        const tpl = nt.templates.find(t => t.ord === ord);
        if (!tpl) continue;

        const fieldValues = flds.split(FIELD_SEP);
        const fieldMap: Record<string, string> = {};
        for (let i = 0; i < nt.fields.length; i++) fieldMap[nt.fields[i]] = fieldValues[i] ?? '';

        const front = htmlToMarkdown(renderTemplate(tpl.qfmt, fieldMap));
        if (!front) continue;

        // Strip {{FrontSide}} from answer template so we don't repeat the question
        const backTpl = tpl.afmt.replace(/\{\{FrontSide\}\}/gi, '');
        const back = htmlToMarkdown(renderTemplate(backTpl, fieldMap));

        if (!deckIdMap.has(did)) deckIdMap.set(did, `apkg-${did}-${importTs}`);
        const ourDeckId = deckIdMap.get(did)!;
        const cardId = `apkg-${nid}-${ord}`;

        const card: StandardCard = {
          id: cardId,
          type: 'standard',
          title: front,
          response: back,
          complexity: complexityFromLapses(lapses),
          tags: ankiTagsToArray(tags),
        };

        if (!deckCards.has(did)) {
          deckCards.set(did, []);
          deckSrsMap.set(did, []);
        }
        deckCards.get(did)!.push(card);

        // SRS
        const intervalDays = Math.max(0, ivl);
        const easeFactor = factor >= 1300 ? factor / 1000 : 2.5;
        let dueAt: number;
        if (queue === 2) {
          // Review queue: due is days since collection creation
          dueAt = (crt + due * 86400) * 1000;
        } else if (queue === 1 || queue === 3) {
          // Learning queue: due is epoch seconds
          dueAt = due * 1000;
        } else {
          dueAt = importTs;
        }

        const ease = lastEase.get(cid);
        const lastResult: CardSRS['lastResult'] =
          ease === 1 ? 'wrong' : ease === 2 ? 'approximate' : ease != null ? 'correct' : null;

        deckSrsMap.get(did)!.push({ cardId, deckId: ourDeckId, intervalDays, easeFactor, dueAt, lastResult });
      }
    }

    const decks: Deck[] = [];
    const srs: CardSRS[] = [];

    for (const [ankiDid, cards] of deckCards) {
      if (!cards.length) continue;
      const ourDeckId = deckIdMap.get(ankiDid)!;
      decks.push({
        id: ourDeckId,
        title: deckNames.get(ankiDid) ?? 'Imported Deck',
        tags: [],
        cards,
        createdAt: importTs,
      });
      srs.push(...(deckSrsMap.get(ankiDid) ?? []));
    }

    return { decks, srs };
  } finally {
    db.close();
  }
}

export async function exportAsApkg(deck: Deck, srsMap: Map<string, CardSRS>): Promise<Uint8Array> {
  const SQL = await getSqlJs();
  const db = new SQL.Database();

  db.run(`
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
  `);

  const nowMs = Date.now();
  const nowSec = Math.floor(nowMs / 1000);
  const collectionCreated = Math.floor((deck.createdAt || nowMs) / 1000);
  const modelId = nowSec;
  const deckId = nowSec + 1;

  const models = {
    [modelId]: {
      id: modelId, name: 'Basic', type: 0, mod: nowSec, usn: -1, sortf: 0, did: deckId,
      tmpls: [{
        name: 'Card 1', ord: 0,
        qfmt: '{{Front}}',
        afmt: '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}',
        bqfmt: '', bafmt: '', did: null, bfont: '', bsize: 0,
      }],
      flds: [
        { name: 'Front', ord: 0, sticky: false, rtl: false, font: 'Arial', size: 20, media: [] },
        { name: 'Back',  ord: 1, sticky: false, rtl: false, font: 'Arial', size: 20, media: [] },
      ],
      css: '.card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }',
      latexPre: '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n',
      latexPost: '\\end{document}',
      latexsvg: false,
      req: [[0, 'any', [0]]],
      tags: [], vers: [],
    },
  };

  const decks = {
    1: { id: 1, name: 'Default', conf: 1, extendNew: 10, extendRev: 50, usn: 0, collapsed: false, newToday: [0, 0], revToday: [0, 0], lrnToday: [0, 0], timeToday: [0, 0], dyn: 0, desc: '', mod: nowSec },
    [deckId]: { id: deckId, name: deck.title, conf: 1, extendNew: 10, extendRev: 50, usn: 0, collapsed: false, newToday: [0, 0], revToday: [0, 0], lrnToday: [0, 0], timeToday: [0, 0], dyn: 0, desc: '', mod: nowSec },
  };

  const dconf = {
    1: { id: 1, name: 'Default', replayq: true, timer: 0, maxTaken: 60, usn: 0, mod: 0, autoplay: true,
      lapse: { delays: [10], mult: 0, minInt: 1, leechFails: 8, leechAction: 0 },
      rev: { perDay: 100, ease4: 1.3, fuzz: 0.05, minSpace: 1, ivlFct: 1, maxIvl: 36500, bury: false, hardFactor: 1.2 },
      new: { perDay: 20, delays: [1, 10], separate: true, ints: [1, 4, 7], initialFactor: 2500, bury: false, order: 1 },
    },
  };

  const conf = { activeDecks: [deckId], curDeck: deckId, newSpread: 0, collapseTime: 1200, timeLim: 0, estTimes: true, dueCounts: true, curModel: String(modelId), nextPos: 1, sortType: 'noteFld', sortBackwards: false, addToCur: true, dayLearnFirst: false, schedVer: 2 };

  db.run('INSERT INTO col VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', [
    1, collectionCreated, nowSec, nowSec, 11, 0, -1, 0,
    JSON.stringify(conf), JSON.stringify(models), JSON.stringify(decks), JSON.stringify(dconf), '{}',
  ]);

  for (let i = 0; i < deck.cards.length; i++) {
    const card = deck.cards[i];
    const noteId = nowMs + i * 2;
    const cardId = nowMs + i * 2 + 1;

    const frontMd = card.title;
    let backMd = '';
    if (card.type === 'standard') {
      backMd = card.response;
    } else {
      backMd = card.options.map((o) => (o.correct ? `✓ ${o.text}` : `• ${o.text}`)).join('\n');
    }

    // Anki renders fields as HTML, so convert our Markdown to HTML
    const front = markdownToHtml(frontMd);
    const back = markdownToHtml(backMd);
    const flds = front + FIELD_SEP + back;
    const tags = (card.tags ?? []).join(' ');
    const guid = noteId.toString(36);

    db.run('INSERT INTO notes VALUES (?,?,?,?,?,?,?,?,?,?,?)', [
      noteId, guid, modelId, nowSec, -1,
      tags ? ` ${tags} ` : '',
      flds, front, fieldChecksum(frontMd), 0, '',
    ]);

    const srsEntry = srsMap.get(card.id);
    let type = 0, queue = 0, due = 0, ivl = 0, factor = 2500;
    if (srsEntry && srsEntry.intervalDays > 0) {
      type = 2; queue = 2;
      ivl = srsEntry.intervalDays;
      factor = Math.round(srsEntry.easeFactor * 1000);
      due = Math.max(0, Math.round((srsEntry.dueAt / 1000 - collectionCreated) / 86400));
    }

    db.run('INSERT INTO cards VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [
      cardId, noteId, deckId, 0, nowSec, -1, type, queue, due, ivl, factor, 0, 0, 0, 0, 0, 0, '',
    ]);
  }

  const dbBytes = db.export();
  db.close();

  return zipSync({
    'collection.anki2': dbBytes,
    'media': new TextEncoder().encode('{}'),
  });
}
