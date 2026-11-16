import { useState } from "react";

import { Page } from "@/components/page";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { writeBackup } from "@/core/backup";
import { type StoredAll, storedNames } from "@/core/handover";
import { readStore, storageKeys } from "@/core/stored";
import { dayKey } from "@/core/stats";
import { now } from "@/effects/clock";
import { download } from "@/effects/files";
import { type HandOverError, NEW_ADDRESS, recordMoved, sendHandOver } from "@/effects/handover";
import { pageHash } from "@/effects/page";
import { looks } from "@/lib/ui-looks";

type Moving = "idle" | "moving" | "moved" | HandOverError["kind"];

/** The old address's screen while it still holds data that has not moved: a button that moves it to the new address, and a backup to download. */
export function HandOverPage({ stored }: { stored: StoredAll }) {
  const { t } = useLanguage();
  const [moving, setMoving] = useState<Moving>("idle");

  function move() {
    setMoving("moving");
    void sendHandOver(stored, pageHash()).match(
      () => {
        recordMoved(now());
        setMoving("moved");
      },
      (error) => setMoving(error.kind),
    );
  }

  function downloadBackup() {
    const at = now();
    readStore(stored).match(
      (store) => download(`anki-backup-${dayKey(at)}.json`, writeBackup(store, at), "application/json"),
      () => {
        const raw = Object.fromEntries(storedNames.map((name) => [storageKeys[name], stored[name]]));
        download("sofi-anki-stored-data.json", JSON.stringify(raw, null, 2), "application/json");
      },
    );
  }

  const failed = moving === "blocked" || moving === "noAnswer" || moving === "refused";

  return (
    <Page>
      <div className={looks.narrow}>
        <h1 className={looks.title}>{t("handover.title")}</h1>
        <p>{t("handover.body")}</p>
        <div className={looks.chips}>
          <Button onClick={move} disabled={moving === "moving"}>
            {t("handover.move")}
          </Button>
          <Button variant="outline" onClick={downloadBackup}>
            {t("handover.backup")}
          </Button>
        </div>
        {moving === "moving" && <p role="status" className={looks.muted}>{t("handover.moving")}</p>}
        {moving === "moved" && <p role="status" className={looks.good}>{t("handover.moved")}</p>}
        {failed && (
          <p role="alert" className={looks.error}>
            {t(`handover.${moving}`)}
          </p>
        )}
        <a className={looks.muted} href={`${NEW_ADDRESS}${pageHash()}`}>
          {t("handover.skip")}
        </a>
      </div>
    </Page>
  );
}
