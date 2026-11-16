import { useEffect, useState, useSyncExternalStore } from "react";
import type { Result } from "neverthrow";

import { useLanguage } from "@/contexts/language-context";
import { drawDiagram } from "@/effects/diagram";
import { onPageClassChange, pageShowsDark } from "@/effects/theme";
import { looks } from "@/lib/ui-looks";

type Drawn = { readonly key: string; readonly svg: Result<string, string> };

/** A Mermaid diagram from a card's ```mermaid block, drawn in the page's light or dark. Its source shows while it loads or when it does not parse. */
export function MermaidDiagram({ source }: { source: string }) {
  const { t } = useLanguage();
  const dark = useSyncExternalStore(onPageClassChange, pageShowsDark);
  const key = `${dark}:${source}`;
  const [drawn, setDrawn] = useState<Drawn | null>(null);

  useEffect(() => {
    let current = true;
    void drawDiagram(source, dark).then((svg) => current && setDrawn({ key, svg }));
    return () => {
      current = false;
    };
  }, [key, source, dark]);

  const svg = drawn?.key === key ? drawn.svg : null;
  if (svg?.isOk()) {
    // Mermaid's own markup, sanitised by its strict security level.
    return <div className="my-2 overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg.value }} />;
  }
  return (
    <div className="my-2">
      <pre tabIndex={0} className="overflow-x-auto font-mono text-xs whitespace-pre-wrap">
        {source}
      </pre>
      {svg?.isErr() && <p className={looks.fine}>{t("diagram.failed").replace("{reason}", svg.error)}</p>}
    </div>
  );
}
