import { useEffect, useState } from "react";

import type { Millis } from "@/core/model";
import { now } from "@/effects/clock";

/** The moment now, read again every `everyMs` and when `refresh` is called. */
export function useNow(everyMs: number): [Millis, () => void] {
  const [at, setAt] = useState(now);
  useEffect(() => {
    const timer = setInterval(() => setAt(now()), everyMs);
    return () => clearInterval(timer);
  }, [everyMs]);
  return [at, () => setAt(now())];
}
