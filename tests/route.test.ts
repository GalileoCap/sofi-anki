import { describe, expect, test } from "vitest";

import { type Route, parseRoute, routeHash } from "@/core/route";

describe("O7, each screen keeps its address", () => {
  const routes: Route[] = [
    { kind: "home" },
    { kind: "stats" },
    { kind: "deck", deckId: "d 1/ñ#" },
    { kind: "deckStats", deckId: "d1" },
    { kind: "study", deckId: null },
    { kind: "study", deckId: "d1" },
    { kind: "share", encoded: "H4sIAAAA_-x" },
  ];

  test("each screen's address opens that screen again", () => {
    for (const route of routes) expect(parseRoute(routeHash(route))).toEqual(route);
  });

  test("addresses bookmarked and shared keep their form", () => {
    expect(routeHash({ kind: "home" })).toBe("");
    expect(routeHash({ kind: "deck", deckId: "abc" })).toBe("#/deck/abc");
    expect(parseRoute("#/share/H4sI")).toEqual({ kind: "share", encoded: "H4sI" });
  });

  test("an address the app does not know opens home", () => {
    for (const hash of ["", "#", "#/", "#/nope", "#/deck/", "#/deck/%E0%A4%A", "#/deck/a/b", "#/share/"]) {
      expect(parseRoute(hash)).toEqual({ kind: "home" });
    }
  });
});
