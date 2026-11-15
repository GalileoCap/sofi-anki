import { gunzipSync, gzipSync, strFromU8, strToU8 } from "fflate";
import { Result } from "neverthrow";

import { type DecodeError, decodeJson } from "@/core/decode";
import { type Deck, deckSchema } from "@/core/model";

/**
 * A share link carries the whole deck after `#/share/`: its JSON, gzipped, in base64url. Links
 * made by the first version, which gzipped with the browser's CompressionStream, read the same.
 */
export const SHARE_PREFIX = "#/share/";

/** The longest link offered. Browsers take far longer hashes, but chat apps and QR codes do not. */
export const MAX_SHARE_URL_LENGTH = 8000;

export type ShareError = { readonly kind: "notALink" } | { readonly kind: "notADeck"; readonly error: DecodeError };

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const fromBase64Url = Result.fromThrowable(
  (text: string): Uint8Array => Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)),
  (): ShareError => ({ kind: "notALink" }),
);

const gunzip = Result.fromThrowable(
  (bytes: Uint8Array): string => strFromU8(gunzipSync(bytes)),
  (): ShareError => ({ kind: "notALink" }),
);

export const encodeDeck = (deck: Deck): string => toBase64Url(gzipSync(strToU8(JSON.stringify(deck))));

export const decodeDeck = (encoded: string): Result<Deck, ShareError> =>
  fromBase64Url(encoded)
    .andThen(gunzip)
    .andThen((json) => decodeJson(deckSchema, json).mapErr((error): ShareError => ({ kind: "notADeck", error })));

/** The link that shares `deck` from the page at `base` (origin and path), or null when it is too long to offer. */
export function shareUrl(base: string, deck: Deck): string | null {
  const url = `${base}${SHARE_PREFIX}${encodeDeck(deck)}`;
  return url.length <= MAX_SHARE_URL_LENGTH ? url : null;
}

/** The encoded deck in a page's hash, or null when the hash is not a share link. */
export const sharedPart = (hash: string): string | null =>
  hash.startsWith(SHARE_PREFIX) ? hash.slice(SHARE_PREFIX.length) : null;
