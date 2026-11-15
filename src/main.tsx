import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/App";
import { LanguageProvider } from "@/contexts/language-provider";
import { isDark } from "@/core/model";
import { demoStore } from "@/core/seed";
import { readTheme } from "@/core/stored";
import { now } from "@/effects/clock";
import { openStore, readStoredValue } from "@/effects/storage";
import { showDark, systemPrefersDark } from "@/effects/theme";
import { UnreadableStore } from "@/pages/unreadable-store";

showDark(isDark(readTheme(readStoredValue("theme")), systemPrefersDark()));

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <LanguageProvider>
        {openStore(() => demoStore(now())).match(
          (store) => <App initial={store} />,
          (error) => <UnreadableStore error={error} />,
        )}
      </LanguageProvider>
    </StrictMode>,
  );
}
