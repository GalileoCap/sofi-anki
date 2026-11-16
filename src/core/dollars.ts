/**
 * Which `$` start inline math, by Pandoc's rule: the opening `$` has a non-space after it, and
 * the closing one a non-space before it and no digit after it. Every other lone `$` is escaped,
 * so a card that reads "it costs $5 and $10" keeps reading so. Code spans and fenced blocks are
 * left as written, and `$$` display math pairs as before.
 */
export function guardDollars(markdown: string): string {
  return markdown
    .split(/(```[\s\S]*?(?:```|$)|~~~[\s\S]*?(?:~~~|$)|`[^`\n]*`)/)
    .map((part, i) => (i % 2 === 1 ? part : guardText(part)))
    .join("");
}

const isSpace = (ch: string | undefined): boolean => ch === undefined || /\s/.test(ch);

/** The index of the `$` closing inline math opened at `open`, or -1 when none on its line does. */
function closer(text: string, open: number): number {
  for (let k = open + 1; k < text.length; k++) {
    const ch = text[k];
    if (ch === "\\") k++;
    else if (ch === "\n") return -1;
    else if (ch === "$") return !isSpace(text[k - 1]) && !/[\d$]/.test(text[k + 1] ?? "") ? k : -1;
  }
  return -1;
}

function guardText(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === "\\") {
      out += text.slice(i, i + 2);
      i += 2;
    } else if (text.startsWith("$$", i)) {
      const end = text.indexOf("$$", i + 2);
      const next = end === -1 ? i + 2 : end + 2;
      out += end === -1 ? "\\$\\$" : text.slice(i, next);
      i = next;
    } else if (text[i] === "$") {
      const end = isSpace(text[i + 1]) ? -1 : closer(text, i);
      out += end === -1 ? "\\$" : text.slice(i, end + 1);
      i = end === -1 ? i + 1 : end + 1;
    } else {
      out += text[i];
      i++;
    }
  }
  return out;
}
