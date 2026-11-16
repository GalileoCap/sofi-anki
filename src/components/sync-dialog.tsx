import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/language-context";
import type { Sync, SyncStatus } from "@/hooks/use-sync";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

type SyncDialogProps = { open: boolean; onOpenChange: (open: boolean) => void; sync: Sync };

/** What sync does and where it stands, with the buttons to turn it on, sync, resume or turn it off. */
export function SyncDialog({ open, onOpenChange, sync }: SyncDialogProps) {
  const { t } = useLanguage();
  const { status } = sync;
  const on = status.kind !== "off" && !(status.kind === "failed" && (status.error.kind === "signInClosed" || status.error.kind === "signInAgain"));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("sync.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-base">{t("sync.about")}</p>
        <p className={looks.lead}>
          {t("sync.where")}{" "}
          <a href="/privacy.html" target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {t("sync.privacy")}
          </a>
        </p>
        <SyncLine status={status} />
        <div className={looks.buttons}>
          {!on ? (
            <Button onClick={() => void sync.turnOn()}>{t("sync.turnOn")}</Button>
          ) : status.kind === "paused" ? (
            <Button onClick={() => void sync.turnOn()}>{t("sync.resume")}</Button>
          ) : (
            <Button variant="outline" disabled={status.kind === "syncing"} onClick={sync.syncNow}>
              {t("sync.now")}
            </Button>
          )}
        </div>
        {on && (
          <div className="flex flex-wrap items-center gap-3 border-t-2 border-dashed border-border pt-3">
            <p className={cn(looks.lead, "basis-48 grow")}>{t("sync.turnOffNote")}</p>
            <Button variant="ghost" onClick={sync.turnOff}>
              {t("sync.turnOff")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Where sync stands, in a line, or nothing when it is off. */
export function SyncLine({ status }: { status: SyncStatus }) {
  const { t, lang } = useLanguage();
  if (status.kind === "off") return null;
  if (status.kind === "failed") {
    const { error } = status;
    const text =
      error.kind === "refused" ? t("sync.refused").replace("{detail}", error.detail) : t(`sync.${error.kind === "expired" ? "paused" : error.kind}`);
    return (
      <p role="alert" className={looks.error}>
        {text}
      </p>
    );
  }
  const text =
    status.kind === "synced"
      ? t("sync.synced").replace("{time}", new Date(status.at).toLocaleTimeString(lang, { hour: "numeric", minute: "2-digit" }))
      : t(status.kind === "syncing" ? "sync.syncing" : "sync.paused");
  return (
    <p role="status" className={looks.lead}>
      {text}
    </p>
  );
}
