import { describe, expect, test } from "vitest";

import { type Card, type ChoiceCard, millis } from "@/core/model";
import { currentCard, gradeChoice, isFinished, startRun, stepRun } from "@/core/run";
import { NEW_SPACING, indexSchedules, nextSpacing, scheduleRun } from "@/core/scheduler";
import { streak } from "@/core/stats";

/** Scaffolding while the screens move onto the core: deleted when the rewrite is done (docs/rewrite-plan.md, Tests). */

const card = (id: string): Card => ({ id, type: "standard", title: id, response: "", complexity: "medium", tags: [] });

describe("the scheduler keeps the old app's spacing", () => {
  test("correct grows by the ease, approximate holds at least a day, wrong starts over", () => {
    const once = nextSpacing(NEW_SPACING, "correct");
    expect(once).toEqual({ intervalDays: 1, easeFactor: 2.6 });
    expect(nextSpacing(once, "correct").intervalDays).toBe(3);
    expect(nextSpacing({ intervalDays: 0, easeFactor: 2 }, "approximate")).toEqual({ intervalDays: 1, easeFactor: 2 });
    expect(nextSpacing({ intervalDays: 9, easeFactor: 1.4 }, "wrong")).toEqual({ intervalDays: 0, easeFactor: 1.3 });
  });

  test("a run moves each answered card by its last answer, and skips nothing else", () => {
    const next = scheduleRun(
      indexSchedules([]),
      "d",
      [
        { card: card("a"), attempts: [{ result: "wrong", durationMs: 1 }, { result: "correct", durationMs: 1 }] },
        { card: card("b"), attempts: [{ result: "skip", durationMs: 1 }] },
      ],
      millis(0),
    );
    expect([...next.keys()]).toEqual(["d:a"]);
    expect(next.get("d:a")).toMatchObject({ intervalDays: 1, dueAt: 86_400_000, lastResult: "correct" });
  });
});

describe("a run", () => {
  test("redo later puts a wrong card five places on, and undo takes it back", () => {
    const cards = "abcdefgh".split("").map(card);
    const after = stepRun(startRun(cards), { kind: "answer", result: "wrong", durationMs: 1, redoLater: true });
    expect(after.queue.map((c) => c.id).join("")).toBe("bcdefagh");
    expect(stepRun(after, { kind: "undo" }).queue.map((c) => c.id).join("")).toBe("abcdefgh");
  });

  test("answering every card finishes it; postponing the last card keeps it last", () => {
    let state = startRun([card("a")]);
    state = stepRun(state, { kind: "postpone", durationMs: 1, random: 0.9 });
    expect(currentCard(state)?.id).toBe("a");
    state = stepRun(state, { kind: "answer", result: "correct", durationMs: 1, redoLater: false });
    expect([isFinished(state), state.results.get("a")?.attempts.map((a) => a.result)]).toEqual([true, ["save_for_later", "correct"]]);
  });

  test("a choice is correct with every right option alone, approximate with some", () => {
    const choice: ChoiceCard = {
      id: "q",
      type: "choice",
      title: "q",
      complexity: "easy",
      tags: [],
      multiSelect: true,
      options: [
        { id: "1", text: "", correct: true },
        { id: "2", text: "", correct: true },
        { id: "3", text: "", correct: false },
      ],
    };
    expect(["1,2", "1", "1,2,3", "3"].map((ids) => gradeChoice(choice, new Set(ids.split(","))))).toEqual([
      "correct",
      "approximate",
      "approximate",
      "wrong",
    ]);
  });

  test("a streak counts back from yesterday when today has no run yet", () => {
    const at = (y: number, m: number, d: number) => millis(new Date(y, m, d, 12).getTime());
    const run = (moment: number) => ({ id: "", deckId: "", completedAt: millis(moment), totalTimeMs: 0, results: [] });
    expect(streak([run(at(2026, 0, 1)), run(at(2026, 0, 2)), run(at(2026, 0, 3))], at(2026, 0, 4))).toBe(3);
    expect(streak([run(at(2026, 0, 1))], at(2026, 0, 4))).toBe(0);
  });
});

describe("the demo seed moved into the core", () => {
  test("it leaves the schedules the old seed wrote", async () => {
    const { demoStore } = await import("@/core/seed");
    const old = (await import("./fixtures/old-seed-storage.json")).default;
    const spacing = (list: readonly { deckId: string; cardId: string; intervalDays: number; easeFactor: number; lastResult: unknown }[]) =>
      list.map((s) => [s.deckId, s.cardId, s.intervalDays, s.easeFactor.toFixed(2), s.lastResult].join(" ")).sort();
    const store = demoStore(millis(Date.UTC(2026, 0, 1)));
    expect(spacing(store.schedules)).toEqual(spacing(JSON.parse(old["anki-srs"])));
    expect(store.runs.length).toBe(17);
  });
});
