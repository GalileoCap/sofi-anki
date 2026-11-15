import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/language-context";
import { type Backup, type RestoreMode, readBackup, restore, writeBackup } from "@/core/backup";
import type { Store } from "@/core/model";
import { dayKey } from "@/core/stats";
import { now } from "@/effects/clock";
import { download, readFileText } from "@/effects/files";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

type BackupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: Store;
  onRestore: (store: Store) => void;
};

/** Downloading everything as one file, and restoring a file, added to what is here or in its place after asking. Each opening starts afresh. */
export function BackupDialog({ open, onOpenChange, store, onRestore }: BackupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <BackupBody store={store} onRestore={onRestore} />
      </DialogContent>
    </Dialog>
  );
}

/** The dialog's inside, whose file, question and outcome go when the dialog closes. */
function BackupBody({ store, onRestore }: Pick<BackupDialogProps, "store" | "onRestore">) {
  const { t } = useLanguage();
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [pending, setPending] = useState<Backup | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function readFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setDone("");
    setConfirmReplace(false);
    readFileText(file).match(
      (text) => readBackup(text).match(setPending, () => setError(t("backup.restoreFailed"))),
      () => setError(t("backup.invalidJson")),
    );
  }

  function doRestore(mode: RestoreMode) {
    if (!pending) return;
    onRestore(restore(store, pending, mode));
    setDone(mode === "replace" ? t("backup.replacedSuccess") : t("backup.mergedSuccess"));
    setPending(null);
    setConfirmReplace(false);
  }

  const part = (title: string, body: string, action: React.ReactNode) => (
    <div className="flex flex-wrap items-center gap-3.5">
      <div className="min-w-48 flex-1">
        <p className="font-bold">{title}</p>
        <p className="text-base text-muted-foreground">{body}</p>
      </div>
      {action}
    </div>
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("backup.title")}</DialogTitle>
      </DialogHeader>

      {part(
        t("backup.downloadTitle"),
        t("backup.exportDesc"),
        <Button
          onClick={() => {
            const at = now();
            download(`anki-backup-${dayKey(at)}.json`, writeBackup(store, at), "application/json");
          }}
        >
          {t("backup.downloadBackup")}
        </Button>,
      )}

      <div className="border-t-2 border-dashed border-border" />

      {part(
        t("backup.restoreTitle"),
        t("backup.restoreDesc"),
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          {t("backup.chooseFile")}
        </Button>,
      )}
      <input ref={fileRef} type="file" accept=".json" onChange={readFile} className="hidden" aria-hidden="true" tabIndex={-1} />

      {pending && !confirmReplace && (
        <div className={looks.stack}>
          <p className="font-bold">{t("backup.how")}</p>
          <div className={cn(looks.buttons, "flex-wrap")}>
            <Button variant="outline" onClick={() => doRestore("merge")}>
              {t("backup.mergeKeep")}
            </Button>
            <Button variant="destructive" onClick={() => setConfirmReplace(true)}>
              {t("backup.replaceAll")}
            </Button>
          </div>
        </div>
      )}

      {confirmReplace && (
        <div className={looks.stack}>
          <p className={looks.error}>{t("backup.confirmReplace")}</p>
          <div className={looks.buttons}>
            <Button variant="ghost" onClick={() => setConfirmReplace(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={() => doRestore("replace")}>
              {t("backup.yesReplace")}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className={looks.error}>
          {error}
        </p>
      )}
      {done && (
        <p role="status" className={looks.good}>
          {done}
        </p>
      )}
    </>
  );
}
