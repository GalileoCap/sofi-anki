import { unzipSync, zipSync } from "fflate";
import { decompress } from "fzstd";
import { marked } from "marked";
import { Result, ResultAsync, err, ok } from "neverthrow";
import initSqlJs, { type Database, type SqlJsStatic, type SqlValue } from "sql.js";
import sqlWasm from "sql.js/dist/sql-wasm.wasm?url";
import TurndownService from "turndown";

import {
  type AnkiCollection,
  type AnkiRow,
  FIELD_SEP,
  type NoteType,
  ankiScheduling,
  backOf,
  deckNamesFromJson,
  decksFromCollection,
  fieldChecksum,
  noteTypesFromJson,
  noteTypesFromTables,
  scheduleOf,
} from "@/core/anki";
import { ANKI_SCHEMA, collectionRow, exportIds } from "@/core/anki-collection";
import type { CardSchedule, Deck, Millis } from "@/core/model";
import type { Schedules } from "@/core/scheduler";

/**
 * The `.apkg` file: a zip holding Anki's SQLite collection. sql.js reads and writes the SQLite,
 * turndown and marked convert the fields between HTML and Markdown. Callers import this module
 * on demand, so its libraries load only when a person imports or exports one.
 */

/** Why an `.apkg` was not read or written. */
export type ApkgError =
  | { readonly kind: "notAnAnkiFile" }
  | { readonly kind: "sqliteUnavailable" }
  | { readonly kind: "unreadableCollection"; readonly detail: string };

const unreadable = (cause: unknown): ApkgError => ({
  kind: "unreadableCollection",
  detail: cause instanceof Error ? cause.message : String(cause),
});

let loading: Promise<SqlJsStatic> | undefined;

function loadSqlite(): ResultAsync<SqlJsStatic, ApkgError> {
  loading ??= initSqlJs({ locateFile: () => sqlWasm });
  return ResultAsync.fromPromise(loading, (): ApkgError => {
    loading = undefined;
    return { kind: "sqliteUnavailable" };
  });
}

const unzip = Result.fromThrowable(unzipSync, (): ApkgError => ({ kind: "notAnAnkiFile" }));
const unzstd = Result.fromThrowable(decompress, unreadable);

/** The collection's SQLite bytes, the newest format first. A zip wrapping an `.apkg` is opened too. */
function collectionBytes(file: Uint8Array): Result<Uint8Array, ApkgError> {
  return unzip(file).andThen((outer) => {
    const inner = Object.keys(outer).find((name) => name.endsWith(".apkg"));
    return inner === undefined ? ok(outer) : unzip(outer[inner]);
  }).andThen((zip): Result<Uint8Array, ApkgError> => {
    if (zip["collection.anki21b"]) return unzstd(zip["collection.anki21b"]);
    const bytes = zip["collection.anki21"] ?? zip["collection.anki2"];
    return bytes === undefined ? err({ kind: "notAnAnkiFile" }) : ok(bytes);
  });
}

/** The rows `sql` returns. */
const query = (db: Database, sql: string): Result<SqlValue[][], ApkgError> =>
  Result.fromThrowable(() => db.exec(sql)[0]?.values ?? [], unreadable)();

/** The rows `sql` returns, or none when its table is missing: older collections lack some tables. */
const optionalQuery = (db: Database, sql: string): SqlValue[][] => query(db, sql).unwrapOr([]);

/** Note types from `col.models`, or, when that is empty as in newer collections, from their tables. */
function noteTypes(db: Database, modelsJson: string): Map<number, NoteType> {
  const fromJson = noteTypesFromJson(modelsJson).unwrapOr(new Map<number, NoteType>());
  if (fromJson.size > 0) return fromJson;
  return noteTypesFromTables(
    optionalQuery(db, "SELECT id, name FROM notetypes").map(([id, name]) => [Number(id), String(name)] as const),
    optionalQuery(db, "SELECT ntid, ord, name FROM fields").map(([nt, ord, name]) => [Number(nt), Number(ord), String(name)] as const),
  );
}

/** Deck names from `col.decks`, or, when that is empty as in newer collections, from their table. */
function deckNames(db: Database, decksJson: string): Map<number, string> {
  const fromJson = deckNamesFromJson(decksJson).unwrapOr(new Map<number, string>());
  if (fromJson.size > 0) return fromJson;
  return new Map(optionalQuery(db, "SELECT id, name FROM decks").map(([id, name]) => [Number(id), String(name)]));
}

const CARD_ROWS = `
  SELECT n.id, n.mid, n.flds, n.tags, c.id, c.did, c.ord, c.queue, c.due, c.ivl, c.factor, c.lapses
  FROM notes n JOIN cards c ON n.id = c.nid
  ORDER BY c.did, n.id`;

const LAST_ANSWERS = "SELECT cid, ease FROM revlog WHERE id IN (SELECT MAX(id) FROM revlog GROUP BY cid)";

function readCollection(db: Database): Result<AnkiCollection, ApkgError> {
  return query(db, "SELECT crt, models, decks FROM col LIMIT 1").andThen((col) => {
    const [created, models, decks] = col[0] ?? [];
    if (created === undefined) return err<AnkiCollection, ApkgError>({ kind: "unreadableCollection", detail: "no col row" });
    return query(db, CARD_ROWS).map((rows) => ({
      created: Number(created),
      noteTypes: noteTypes(db, String(models ?? "")),
      deckNames: deckNames(db, String(decks ?? "")),
      rows: rows.map(
        (r): AnkiRow => ({
          noteId: Number(r[0]),
          modelId: Number(r[1]),
          fields: String(r[2]),
          tags: String(r[3]),
          cardId: Number(r[4]),
          deckId: Number(r[5]),
          ord: Number(r[6]),
          queue: Number(r[7]),
          due: Number(r[8]),
          ivl: Number(r[9]),
          factor: Number(r[10]),
          lapses: Number(r[11]),
        }),
      ),
      lastEase: new Map(optionalQuery(db, LAST_ANSWERS).map(([cardId, ease]) => [Number(cardId), Number(ease)])),
    }));
  });
}

/** `work` run on a database opened on `bytes`, closed after. */
function withDatabase<T>(sqlite: SqlJsStatic, bytes: Uint8Array | undefined, work: (db: Database) => Result<T, ApkgError>): Result<T, ApkgError> {
  return Result.fromThrowable(() => new sqlite.Database(bytes), unreadable)().andThen((db) => {
    try {
      return work(db);
    } finally {
      db.close();
    }
  });
}

const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });
const toMarkdown = (html: string): string => turndown.turndown(html).trim();
const toHtml = (markdown: string): string => marked.parse(markdown, { async: false });

/**
 * The decks and schedules in an `.apkg`'s bytes, imported at `now`.
 *
 * @effects sql.js load, DOM (turndown)
 */
export function readApkg(file: Uint8Array, now: Millis): ResultAsync<{ decks: Deck[]; schedules: CardSchedule[] }, ApkgError> {
  return loadSqlite().andThen((sqlite) =>
    collectionBytes(file)
      .andThen((bytes) => withDatabase(sqlite, bytes, readCollection))
      .map((collection) => decksFromCollection(collection, now, toMarkdown)),
  );
}

const NOTE_SQL = "INSERT INTO notes VALUES (?,?,?,?,?,?,?,?,?,?,?)";
const CARD_SQL = "INSERT INTO cards VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

function writeCollection(db: Database, deck: Deck, schedules: Schedules, now: Millis): void {
  const nowSec = Math.floor(now / 1000);
  const created = Math.floor(deck.createdAt / 1000);
  const { modelId, deckId } = exportIds(nowSec);
  db.run(ANKI_SCHEMA);
  db.run("INSERT INTO col VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", collectionRow(deck.title, created, nowSec));
  deck.cards.forEach((card, i) => {
    const noteId = now + i * 2;
    const front = toHtml(card.title);
    const tags = card.tags.join(" ");
    db.run(NOTE_SQL, [
      noteId,
      noteId.toString(36),
      modelId,
      nowSec,
      -1,
      tags ? ` ${tags} ` : "",
      front + FIELD_SEP + toHtml(backOf(card)),
      front,
      fieldChecksum(card.title),
      0,
      "",
    ]);
    const { type, queue, due, ivl, factor } = ankiScheduling(scheduleOf(schedules, deck, card.id), created);
    db.run(CARD_SQL, [noteId + 1, noteId, deckId, 0, nowSec, -1, type, queue, due, ivl, factor, 0, 0, 0, 0, 0, 0, ""]);
  });
}

/**
 * `deck` as an `.apkg` Anki opens, with each card's schedule, exported at `now`.
 *
 * @effects sql.js load
 */
export function writeApkg(deck: Deck, schedules: Schedules, now: Millis): ResultAsync<Uint8Array<ArrayBuffer>, ApkgError> {
  return loadSqlite().andThen((sqlite) =>
    withDatabase(sqlite, undefined, (db) =>
      Result.fromThrowable(() => {
        writeCollection(db, deck, schedules, now);
        return db.export();
      }, unreadable)(),
    ).map((bytes) => zipSync({ "collection.anki2": bytes, media: new TextEncoder().encode("{}") })),
  );
}
