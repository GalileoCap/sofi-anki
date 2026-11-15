import { useEffect, useState } from "react";

import type { Deck } from "@/core/model";
import { randoms } from "@/effects/clock";
import { deckColour } from "@/lib/sticker-looks";

const PIECES = 40;
/** How long the stickers fall before they go. */
const SHOWN_MS = 3500;

/** One falling sticker, from six numbers in [0, 1): where it starts, its deck, when, how fast, how large, how far it drifts. */
function piece(decks: readonly Deck[], [x, deck, delay, duration, size, drift]: number[]) {
  return {
    deck: decks[Math.floor(deck * decks.length)],
    left: `${x * 100}%`,
    animationDelay: `${delay * 0.5}s`,
    animationDuration: `${1.5 + duration * 1.5}s`,
    size: `${0.5 + size * 0.5}rem`,
    drift: `${(drift - 0.5) * 60}px`,
  };
}

/** Stickers in the run's decks' colours falling over the page for a few seconds, or nothing where motion is reduced. */
export function StickerShower({ decks }: { decks: readonly Deck[] }) {
  const [pieces] = useState(() => Array.from({ length: PIECES }, () => piece(decks, randoms(6))));
  const [falling, setFalling] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setFalling(false), SHOWN_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!falling) return null;
  return (
    <div className="pointer-events-none fixed inset-0 hidden overflow-hidden motion-safe:block" aria-hidden="true">
      {pieces.map(({ deck, left, animationDelay, animationDuration, size, drift }, i) => (
        <i
          key={i}
          className="absolute -top-4 block animate-sticker-fall rounded-full border-2 border-card bg-(--deck) shadow-sm"
          style={{ ...deckColour(deck), left, animationDelay, animationDuration, width: size, height: size, ["--drift" as string]: drift }}
        />
      ))}
    </div>
  );
}
