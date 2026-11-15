import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { type Backup, type RestoreMode, readBackup, restore, writeBackup } from "@/core/backup";
import { dayKey } from "@/core/stats";
import type { Store } from "@/core/model";
import { now } from "@/effects/clock";
import { download, readFileText } from "@/effects/files";

interface BackupDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  store: Store;
  onRestore: (store: Store) => void;
}

export function BackupDialog({ trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange, store, onRestore }: BackupDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [pending, setPending] = useState<Backup | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { t } = useLanguage();

  function handleOpenChange(next: boolean) {
    setInternalOpen(next);
    controlledOnOpenChange?.(next);
  }

  function handleExport() {
    const at = now();
    download(`anki-backup-${dayKey(at)}.json`, writeBackup(store, at), "application/json");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setSuccess("");
    setConfirmReplace(false);
    readFileText(file).match(
      (text) => readBackup(text).match(setPending, () => setError(t("backup.restoreFailed"))),
      () => setError(t("backup.invalidJson")),
    );
  }

  function doRestore(mode: RestoreMode) {
    if (!pending) return;
    onRestore(restore(store, pending, mode));
    setSuccess(mode === "replace" ? t("backup.replacedSuccess") : t("backup.mergedSuccess"));
    setPending(null);
    setConfirmReplace(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("backup.title")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {t("backup.exportDesc")}
          </p>
          <Button variant="outline" onClick={handleExport}>
            {t("backup.downloadBackup")}
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {t("backup.restoreDesc")}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
          />

          {pending && !confirmReplace && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => doRestore("merge")}>
                {t("backup.mergeKeep")}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirmReplace(true)}>
                {t("backup.replaceAll")}
              </Button>
            </div>
          )}

          {confirmReplace && (
            <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">
                {t("backup.confirmReplace")}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => doRestore("replace")}>
                  {t("backup.yesReplace")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmReplace(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
