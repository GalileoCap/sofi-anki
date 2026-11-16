import { ResultAsync } from "neverthrow";

import { newId } from "@/effects/clock";

/**
 * A colour token of the page as `#rrggbb`, which Mermaid's colour maths reads, through a canvas
 * pixel, since the tokens are written in oklch.
 *
 * @effects DOM
 */
function tokenHex(pixel: CanvasRenderingContext2D, style: CSSStyleDeclaration, token: string): string {
  pixel.clearRect(0, 0, 1, 1);
  pixel.fillStyle = style.getPropertyValue(token).trim();
  pixel.fillRect(0, 0, 1, 1);
  const [r, g, b] = pixel.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Mermaid's `base` theme in the page's colours and font as they are now: light or dark, the
 * sticker chart or the classic look.
 *
 * @effects DOM
 */
function pageTheme() {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const pixel = canvas.getContext("2d", { willReadFrequently: true });
  const hex = (token: string) => (pixel ? tokenHex(pixel, style, token) : undefined);
  const font = style.getPropertyValue("--font-sans").trim();
  return {
    theme: "base" as const,
    fontFamily: font,
    themeVariables: {
      darkMode: root.classList.contains("dark"),
      fontFamily: font,
      background: hex("--card"),
      primaryColor: hex("--muted"),
      primaryBorderColor: hex("--primary"),
      primaryTextColor: hex("--foreground"),
      secondaryColor: hex("--secondary"),
      tertiaryColor: hex("--card"),
      lineColor: hex("--muted-foreground"),
      edgeLabelBackground: hex("--card"),
    },
  };
}

/**
 * A Mermaid diagram drawn as SVG markup in the page's colours, or why it was not. Mermaid is
 * imported on demand, so its megabytes load only when a card holds a diagram. `strict` security
 * escapes HTML in labels and turns off click handlers, since a shared deck's diagrams are another
 * person's text.
 *
 * @effects module load, DOM (Mermaid measures labels in a hidden element, removed after)
 */
export const drawDiagram = (source: string): ResultAsync<string, string> =>
  ResultAsync.fromPromise(
    import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", ...pageTheme() });
      // Parsed first: a render that fails leaves Mermaid's error drawing in the body, a parse does not.
      await mermaid.parse(source);
      const id = `diagram-${newId()}`;
      try {
        return (await mermaid.render(id, source)).svg;
      } finally {
        document.getElementById(`d${id}`)?.remove();
      }
    }),
    (cause) => (cause instanceof Error ? cause.message : String(cause)),
  );
