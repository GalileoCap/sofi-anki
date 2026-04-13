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
import { TagInput } from "@/components/tag-input";
import type { Card, CardType, Complexity } from "@/types";
import { cn } from "@/lib/utils";

const COMPLEXITIES: { value: Complexity; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const CARD_TYPES: { value: CardType; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "choice", label: "Choice" },
];

interface CardFormProps {
  trigger: React.ReactNode;
  onSubmit: (card: Omit<Card, "id">) => void;
  initial?: Card;
  dialogTitle?: string;
  submitLabel?: string;
}

interface OptionRow {
  id: string;
  text: string;
  correct: boolean;
}

function newOption(): OptionRow {
  return { id: crypto.randomUUID(), text: "", correct: false };
}

export function CardForm({
  trigger,
  onSubmit,
  initial,
  dialogTitle = "New Card",
  submitLabel = "Add",
}: CardFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [complexity, setComplexity] = useState<Complexity>(initial?.complexity ?? "medium");
  const [cardType, setCardType] = useState<CardType>(initial?.type ?? "standard");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);

  // Standard fields
  const [response, setResponse] = useState(
    initial?.type === "standard" ? initial.response : ""
  );

  // Choice fields
  const [options, setOptions] = useState<OptionRow[]>(() => {
    if (initial?.type === "choice") {
      return initial.options.map((o) => ({ id: o.id, text: o.text, correct: o.correct }));
    }
    return [newOption(), newOption()];
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setTitle(initial?.title ?? "");
      setComplexity(initial?.complexity ?? "medium");
      setCardType(initial?.type ?? "standard");
      setTags(initial?.tags ?? []);
      setResponse(initial?.type === "standard" ? initial.response : "");
      setOptions(
        initial?.type === "choice"
          ? initial.options.map((o) => ({ id: o.id, text: o.text, correct: o.correct }))
          : [newOption(), newOption()]
      );
    }
  }

  function addOption() {
    setOptions((prev) => [...prev, newOption()]);
  }

  function removeOption(id: string) {
    setOptions((prev) => prev.filter((o) => o.id !== id));
  }

  function updateOptionText(id: string, text: string) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
  }

  function toggleOptionCorrect(id: string) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, correct: !o.correct } : o)));
  }

  const isValidStandard = title.trim() && response.trim();
  const isValidChoice =
    title.trim() &&
    options.length >= 2 &&
    options.every((o) => o.text.trim()) &&
    options.some((o) => o.correct);
  const isValid = cardType === "standard" ? isValidStandard : isValidChoice;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    if (cardType === "standard") {
      onSubmit({
        type: "standard",
        title: title.trim(),
        response: response.trim(),
        complexity,
        tags,
      } as Omit<Card, "id">);
    } else {
      const correctCount = options.filter((o) => o.correct).length;
      onSubmit({
        type: "choice",
        title: title.trim(),
        complexity,
        tags,
        multiSelect: correctCount > 1,
        options: options.map((o) => ({
          id: o.id,
          text: o.text.trim(),
          correct: o.correct,
        })),
      } as Omit<Card, "id">);
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Card type selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">Type</label>
            <div className="flex gap-1.5">
              {CARD_TYPES.map((t) => (
                <Button
                  key={t.value}
                  type="button"
                  variant={cardType === t.value ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setCardType(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          <Input
            placeholder="Question / front of card"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          {cardType === "standard" ? (
            <Textarea
              placeholder="Answer / back of card"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
            />
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-sm text-muted-foreground">
                Options (check the correct ones)
              </label>
              {options.map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={opt.correct}
                    onChange={() => toggleOptionCorrect(opt.id)}
                    className="rounded shrink-0"
                  />
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={opt.text}
                    onChange={(e) => updateOptionText(opt.id, e.target.value)}
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeOption(opt.id)}
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      &times;
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
              >
                Add Option
              </Button>
              {options.some((o) => o.correct) && (
                <p className="text-xs text-muted-foreground">
                  {options.filter((o) => o.correct).length > 1
                    ? "Multiple correct — will be multi-select during study"
                    : "Single correct — will be single-select during study"}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">Complexity</label>
            <div className="flex gap-1.5">
              {COMPLEXITIES.map((c) => (
                <Button
                  key={c.value}
                  type="button"
                  variant={complexity === c.value ? "default" : "outline"}
                  size="sm"
                  className={cn("flex-1")}
                  onClick={() => setComplexity(c.value)}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">Tags</label>
            <TagInput tags={tags} onChange={setTags} placeholder="Add tags..." />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!isValid}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
