import { Page } from "@/components/page";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { storageKeys, type StoredError } from "@/core/stored";
import { download } from "@/effects/files";
import { type StorageError, readStoredText } from "@/effects/storage";
import { looks } from "@/lib/looks";

/** What shows instead of the app when the stored data does not read: the part that failed, and a way to keep a copy. */
export function UnreadableStore({ error }: { error: StoredError | StorageError }) {
  const { t } = useLanguage();

  function downloadStored() {
    readStoredText().map((text) => {
      const raw = Object.fromEntries(Object.entries(text).map(([key, value]) => [storageKeys[key as keyof typeof text], value]));
      download("sofi-anki-stored-data.json", JSON.stringify(raw, null, 2), "application/json");
    });
  }

  return (
    <Page>
      <div className="flex flex-col gap-4">
        <h1 className={looks.title}>{t("store.unreadableTitle")}</h1>
        {error.kind === "unreadable" ? (
          <>
            <p>{t("store.unreadableBody")}</p>
            <p className={looks.muted}>
              {t("store.unreadablePart")} <code>{storageKeys[error.key]}</code>
            </p>
            <pre className="max-h-64 overflow-auto rounded bg-muted p-2 text-xs">
              {error.error.kind === "badShape" ? error.error.detail : "JSON"}
            </pre>
            <Button className="self-start" onClick={downloadStored}>
              {t("store.download")}
            </Button>
          </>
        ) : (
          <p>{t("store.storageRefused")}</p>
        )}
      </div>
    </Page>
  );
}
