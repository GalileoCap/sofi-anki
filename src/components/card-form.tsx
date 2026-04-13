import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CardFormProps {
  trigger: React.ReactNode;
  onSubmit: (title: string, response: string) => void;
  initialTitle?: string;
  initialResponse?: string;
  dialogTitle?: string;
  submitLabel?: string;
}

export function CardForm({
  trigger,
  onSubmit,
  initialTitle = "",
  initialResponse = "",
  dialogTitle = "New Card",
  submitLabel = "Add",
}: CardFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [response, setResponse] = useState(initialResponse);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setTitle(initialTitle);
      setResponse(initialResponse);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const r = response.trim();
    if (!t || !r) return;
    onSubmit(t, r);
    setTitle("");
    setResponse("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            placeholder="Question / front of card"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            placeholder="Answer / back of card"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button type="submit" disabled={!title.trim() || !response.trim()}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
