import { describe, expect, test } from "vitest";

import { guardDollars } from "@/core/dollars";

describe("a card written before math keeps reading as it did", () => {
  test("prices stay prices, and math between dollars is math", () => {
    expect(guardDollars("it costs $5 and $10.")).toBe("it costs \\$5 and \\$10.");
    expect(guardDollars("$ 5 or a lone $")).toBe("\\$ 5 or a lone \\$");
    expect(guardDollars("radius $r$, $\\frac{a}{b}$ and $$A = \\pi r^2$$")).toBe("radius $r$, $\\frac{a}{b}$ and $$A = \\pi r^2$$");
    expect(guardDollars("`$5 and $10` and\n```\n$x and $y\n```")).toBe("`$5 and $10` and\n```\n$x and $y\n```");
    expect(guardDollars("already \\$5")).toBe("already \\$5");
  });
});
