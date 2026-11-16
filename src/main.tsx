import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/App";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/language-provider";
import { isDark } from "@/core/model";
import { demoStore } from "@/core/seed";
import { readLook, readTheme } from "@/core/stored";
import { now } from "@/effects/clock";
import { openStore, readStoredValue } from "@/effects/storage";
import { showClassic, showDark, systemPrefersDark } from "@/effects/theme";
import { UnreadableStore } from "@/pages/unreadable-store";

showDark(isDark(readTheme(readStoredValue("theme")), systemPrefersDark()));
showClassic(readLook(readStoredValue("look")) === "classic");

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <LanguageProvider>
        <TooltipProvider delayDuration={300}>
          {openStore(() => demoStore(now())).match(
            (store) => <App initial={store} />,
            (error) => <UnreadableStore error={error} />,
          )}
        </TooltipProvider>
      </LanguageProvider>
    </StrictMode>,
  );
}
