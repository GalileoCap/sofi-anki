import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { copyText } from "@/effects/files";
import type { TranslationKey } from "@/lib/translations";

type Copy = "idle" | "copied" | "refused";
const labels: Record<Copy, TranslationKey> = { idle: "common.copy", copied: "common.copied", refused: "common.copyRefused" };

/** How long the button says whether it copied. */
const NOTICE_MS = 2000;

/** Copies `text`, then says for two seconds whether the browser let it. */
export function CopyButton({ text }: { text: string }) {
  const { t } = useLanguage();
  const [copy, setCopy] = useState<Copy>("idle");

  async function copyNow() {
    setCopy((await copyText(text)).isOk() ? "copied" : "refused");
    setTimeout(() => setCopy("idle"), NOTICE_MS);
  }

  return (
    <Button variant="outline" onClick={copyNow}>
      {t(labels[copy])}
    </Button>
  );
}
