import type { Millis } from "@/core/model";

/** `ms` as minutes and seconds on a clock face, `07:05`. */
export function clockFace(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

/** `ms` on a clock face under an hour, and in hours and minutes from an hour, `1h 5m`. */
export function longClockFace(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : clockFace(ms);
}

/** `ms` in words of units, `<1s`, `45s`, `2m 5s`, `3m`. */
export function shortDuration(ms: number): string {
  if (ms < 1000) return "<1s";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const rest = seconds % 60;
  return rest > 0 ? `${Math.floor(seconds / 60)}m ${rest}s` : `${Math.floor(seconds / 60)}m`;
}

/** A timer that leaves its pauses out: started at `startedAt`, paused since `pausedAt` when paused. */
export type Stopwatch = { readonly startedAt: Millis; readonly pausedMs: number; readonly pausedAt: Millis | null };

export const startStopwatch = (at: Millis): Stopwatch => ({ startedAt: at, pausedMs: 0, pausedAt: null });

/** The time the watch has run by `at`, its pauses left out. */
export const elapsed = (watch: Stopwatch, at: Millis): number =>
  (watch.pausedAt ?? at) - watch.startedAt - watch.pausedMs;

export const pauseStopwatch = (watch: Stopwatch, at: Millis): Stopwatch =>
  watch.pausedAt === null ? { ...watch, pausedAt: at } : watch;

export const resumeStopwatch = (watch: Stopwatch, at: Millis): Stopwatch =>
  watch.pausedAt === null ? watch : { ...watch, pausedMs: watch.pausedMs + (at - watch.pausedAt), pausedAt: null };
