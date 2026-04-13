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
import { DECK_COLORS } from "@/lib/deck-colors";
import { cn } from "@/lib/utils";

interface DeckFormProps {
  trigger: React.ReactNode;
  onSubmit: (title: string, tags: string[], color?: string, emoji?: string) => void;
  initialTitle?: string;
  initialTags?: string[];
  initialColor?: string;
  initialEmoji?: string;
  dialogTitle?: string;
  submitLabel?: string;
}

export function DeckForm({
  trigger,
  onSubmit,
  initialTitle = "",
  initialTags = [],
  initialColor,
  initialEmoji,
  dialogTitle = "New Deck",
  submitLabel = "Create",
}: DeckFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [color, setColor] = useState<string | undefined>(initialColor);
  const [emoji, setEmoji] = useState(initialEmoji ?? "");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setTitle(initialTitle);
      setTags(initialTags);
      setColor(initialColor);
      setEmoji(initialEmoji ?? "");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit(trimmed, tags, color, emoji.trim() || undefined);
    setTitle("");
    setTags([]);
    setColor(undefined);
    setEmoji("");
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

          {/* Color palette */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">Cover Color</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setColor(undefined)}
                className={cn(
                  "h-7 w-7 rounded-full border-2 bg-muted transition-all",
                  !color ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                )}
                title="No color"
              />
              {DECK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-all",
                    color === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Emoji */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">Emoji (optional)</label>
            <div className="flex items-center gap-2">
              {emoji && (
                <span className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted text-xl">
                  {emoji}
                </span>
              )}
              <Input
                placeholder="e.g. 🌟"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-32"
              />
            </div>
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
