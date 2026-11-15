import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
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
import { Field } from "@/components/field";
import { TagInput } from "@/components/tag-input";
import { DECK_COLORS } from "@/lib/deck-colors";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

/** A colour to pick for the deck's spine, ringed in ink when picked. */
const swatch = (picked: boolean): string =>
  cn("size-10 cursor-pointer rounded-full border-[3px] transition-colors", picked ? "border-foreground" : "border-card hover:border-border");

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
  dialogTitle,
  submitLabel,
}: DeckFormProps) {
  const { t } = useLanguage();
  const resolvedTitle = dialogTitle ?? t("deckForm.newDeck");
  const resolvedSubmit = submitLabel ?? t("common.create");
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
          <DialogTitle>{resolvedTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className={looks.form}>
          <Field label={t("deckForm.title")}>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </Field>
          <Field label={t("common.tags")}>
            <TagInput tags={tags} onChange={setTags} placeholder={t("deckForm.tagsPlaceholder")} />
          </Field>
          <Field label={t("deckForm.coverColor")} group>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setColor(undefined)}
                className={cn("bg-muted", swatch(!color))}
                title={t("deckForm.noColor")}
                aria-label={t("deckForm.noColor")}
                aria-pressed={!color}
              />
              {DECK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={swatch(color === c)}
                  style={{ backgroundColor: c }}
                  title={c}
                  aria-label={c}
                  aria-pressed={color === c}
                />
              ))}
            </div>
          </Field>
          <Field label={t("deckForm.emoji")}>
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-32" />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {resolvedSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
