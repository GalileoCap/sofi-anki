import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TagInput } from "@/components/tag-input";

interface DeckFormProps {
  trigger: React.ReactNode;
  onSubmit: (title: string, tags: string[]) => void;
  initialTitle?: string;
  initialTags?: string[];
  dialogTitle?: string;
  submitLabel?: string;
}

export function DeckForm({
  trigger,
  onSubmit,
  initialTitle = "",
  initialTags = [],
  dialogTitle = "New Deck",
  submitLabel = "Create",
}: DeckFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [tags, setTags] = useState<string[]>(initialTags);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setTitle(initialTitle);
      setTags(initialTags);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit(trimmed, tags);
    setTitle("");
    setTags([]);
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
            placeholder="Deck title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">Tags</label>
            <TagInput tags={tags} onChange={setTags} placeholder="Add tags..." />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!title.trim()}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
