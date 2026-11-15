import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/language-context";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** What is lost or kept, and whether it can be undone. */
  body: string;
  /** The button's words, which say what it deletes. */
  confirm: string;
  onConfirm: () => void;
  /** False when nothing is lost, so the button is the screen's plain action. */
  destructive?: boolean;
  /** The cancel button's words, when "Cancel" says less than staying put. */
  cancel?: string;
};

/** Asks before a deletion or a step out, with what it does named on its button. */
export function ConfirmDialog({ open, onOpenChange, title, body, confirm, onConfirm, destructive = true, cancel }: ConfirmDialogProps) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {cancel ?? t("common.cancel")}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
