import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/App";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/language-provider";
import { isDark } from "@/core/model";
import { RECEIVE_HASH } from "@/core/handover";
import { demoStore } from "@/core/seed";
import { readLook, readStamps, readTheme } from "@/core/stored";
import { now } from "@/effects/clock";
import { receiveHandOver } from "@/effects/handover";
import { pageHash, replaceHash } from "@/effects/page";
import { openStore, readStoredValue } from "@/effects/storage";
import { showClassic, showDark, systemPrefersDark } from "@/effects/theme";
import { UnreadableStore } from "@/pages/unreadable-store";

/** The app, on the store as this browser holds it, in the theme and look it keeps. */
function start(root: HTMLElement) {
  showDark(isDark(readTheme(readStoredValue("theme")), systemPrefersDark()));
  showClassic(readLook(readStoredValue("look")) === "classic");
  createRoot(root).render(
    <StrictMode>
      <LanguageProvider>
        <TooltipProvider delayDuration={300}>
          {openStore(() => demoStore(now())).match(
            (store) => <App initial={store} stamps={readStamps(readStoredValue("syncStamps"))} />,
            (error) => <UnreadableStore error={error} />,
          )}
        </TooltipProvider>
      </LanguageProvider>
    </StrictMode>,
  );
}

// Opened by the old address to take its data: the app starts once the data is in, on the screen
// the old address was showing.
const root = document.getElementById("root");
if (root) {
  if (pageHash() === RECEIVE_HASH) {
    void receiveHandOver().then((hash) => {
      replaceHash(hash ?? "");
      start(root);
    });
  } else {
    start(root);
  }
}
