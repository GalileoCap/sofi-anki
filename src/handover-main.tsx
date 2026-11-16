import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { LanguageProvider } from "@/contexts/language-provider";
import { holdsData } from "@/core/handover";
import { isDark } from "@/core/model";
import { readLook, readTheme } from "@/core/stored";
import { forwardToNew, movedAlready } from "@/effects/handover";
import { pageHash } from "@/effects/page";
import { readStoredAll, readStoredValue } from "@/effects/storage";
import { showClassic, showDark, systemPrefersDark } from "@/effects/theme";
import { HandOverPage } from "@/pages/hand-over";

// The old address, galileocap.github.io/sofi-anki/: it forwards to the new one at the same hash,
// unless this browser holds decks or runs here that have not moved.
const stored = readStoredAll().unwrapOr(null);
const root = document.getElementById("root");
if (stored === null || !holdsData(stored) || movedAlready() || root === null) {
  forwardToNew(pageHash());
} else {
  showDark(isDark(readTheme(readStoredValue("theme")), systemPrefersDark()));
  showClassic(readLook(readStoredValue("look")) === "classic");
  createRoot(root).render(
    <StrictMode>
      <LanguageProvider>
        <HandOverPage stored={stored} />
      </LanguageProvider>
    </StrictMode>,
  );
}
