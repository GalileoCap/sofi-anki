import { useEffect, useState } from "react";

import { randoms } from "@/effects/clock";

/** The confetti takes the colours of the three results and the accent, from the tokens. */
const fills = ["var(--positive)", "var(--caution)", "var(--negative)", "var(--primary)"];

const PIECES = 50;
/** How long the confetti falls before it goes. */
const SHOWN_MS = 3500;

/** One piece of confetti, from seven numbers in [0, 1). */
function piece([x, color, delay, duration, size, drift, round]: number[]) {
  return {
    x: x * 100,
    color: fills[Math.floor(color * fills.length)],
    delay: delay * 0.5,
    duration: 1.5 + duration * 1.5,
    size: 4 + size * 6,
    drift: (drift - 0.5) * 60,
    round: round > 0.5,
  };
}

/** Confetti falling over its parent for a few seconds. */
export function Confetti() {
  const [pieces] = useState(() => Array.from({ length: PIECES }, () => piece(randoms(7))));
  const [falling, setFalling] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setFalling(false), SHOWN_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!falling) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <div
          key={i}
          className="absolute -top-2.5 animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.round ? "50%" : "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
