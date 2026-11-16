import { ResultAsync } from "neverthrow";

import { newId } from "@/effects/clock";

/**
 * A Mermaid diagram drawn as SVG markup, or why it was not. Mermaid is imported on demand, so
 * its megabytes load only when a card holds a diagram. `strict` security escapes HTML in labels
 * and turns off click handlers, since a shared deck's diagrams are another person's text.
 *
 * @effects module load, DOM (Mermaid measures labels in a hidden element, removed after)
 */
export const drawDiagram = (source: string, dark: boolean): ResultAsync<string, string> =>
  ResultAsync.fromPromise(
    import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: dark ? "dark" : "default", fontFamily: "inherit" });
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
