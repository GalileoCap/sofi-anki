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
import { exportAllData, importAllData } from "@/lib/storage";

interface BackupDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRestored: () => void;
}

export function BackupDialog({ trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange, onRestored }: BackupDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [pendingJson, setPendingJson] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { t } = useLanguage();

  function handleOpenChange(next: boolean) {
    setInternalOpen(next);
    controlledOnOpenChange?.(next);
  }

  function handleExport() {
    const data = exportAllData();
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anki-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setSuccess("");
    setConfirmReplace(false);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = reader.result as string;
        JSON.parse(json); // validate
        setPendingJson(json);
      } catch {
        setError(t("backup.invalidJson"));
      }
    };
    reader.readAsText(file);
  }

  function doRestore(mode: "replace" | "merge") {
    if (!pendingJson) return;
    try {
      importAllData(pendingJson, mode);
      setSuccess(mode === "replace" ? t("backup.replacedSuccess") : t("backup.mergedSuccess"));
      setPendingJson(null);
      setConfirmReplace(false);
      if (fileRef.current) fileRef.current.value = "";
      onRestored();
    } catch {
      setError(t("backup.restoreFailed"));
    }
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

          {pendingJson && !confirmReplace && (
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
