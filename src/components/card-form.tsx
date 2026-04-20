import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import type { TranslationKey } from "@/lib/translations";
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
import { Markdown } from "@/components/markdown";
import type { Card, CardType, Complexity } from "@/types";
import { cn } from "@/lib/utils";

const COMPLEXITIES: { value: Complexity; key: TranslationKey }[] = [
  { value: "easy", key: "complexity.easy" },
  { value: "medium", key: "complexity.medium" },
  { value: "hard", key: "complexity.hard" },
];

const CARD_TYPES: { value: CardType; key: TranslationKey }[] = [
  { value: "standard", key: "cardType.standard" },
  { value: "choice", key: "cardType.choice" },
];

interface CardFormProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSubmit,
  initial,
  dialogTitle,
  submitLabel,
}: CardFormProps) {
  const { t } = useLanguage();
  const resolvedTitle = dialogTitle ?? t("cardForm.newCard");
  const resolvedSubmit = submitLabel ?? t("common.add");
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [complexity, setComplexity] = useState<Complexity>(initial?.complexity ?? "medium");
  const [cardType, setCardType] = useState<CardType>(initial?.type ?? "standard");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [hint, setHint] = useState(initial?.hint ?? "");
  const [showHintInput, setShowHintInput] = useState(!!(initial?.hint));
  const [previewResponse, setPreviewResponse] = useState(false);

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
    setInternalOpen(next);
    controlledOnOpenChange?.(next);
    if (next) {
      setTitle(initial?.title ?? "");
      setComplexity(initial?.complexity ?? "medium");
      setCardType(initial?.type ?? "standard");
      setTags(initial?.tags ?? []);
      setHint(initial?.hint ?? "");
      setShowHintInput(!!(initial?.hint));
      setPreviewResponse(false);
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

    const hintValue = hint.trim() || undefined;
    if (cardType === "standard") {
      onSubmit({
        type: "standard",
        title: title.trim(),
        response: response.trim(),
        complexity,
        tags,
        hint: hintValue,
      } as Omit<Card, "id">);
    } else {
      const correctCount = options.filter((o) => o.correct).length;
      onSubmit({
        type: "choice",
        title: title.trim(),
        complexity,
        tags,
        hint: hintValue,
        multiSelect: correctCount > 1,
        options: options.map((o) => ({
          id: o.id,
          text: o.text.trim(),
          correct: o.correct,
        })),
      } as Omit<Card, "id">);
    }
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Card type selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">{t("common.type")}</label>
            <div className="flex gap-1.5">
              {CARD_TYPES.map((ct) => (
                <Button
                  key={ct.value}
                  type="button"
                  variant={cardType === ct.value ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setCardType(ct.value)}
                >
                  {t(ct.key)}
                </Button>
              ))}
            </div>
          </div>

          <Input
            placeholder={t("cardForm.questionPlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          {cardType === "standard" ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">{t("common.answer")}</label>
                <button
                  type="button"
                  onClick={() => setPreviewResponse((v) => !v)}
                  className={cn(
                    "text-xs underline underline-offset-2",
                    previewResponse
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {previewResponse ? t("common.edit") : t("common.preview")}
                </button>
              </div>
              {previewResponse ? (
                <div className="min-h-[96px] rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {response.trim() ? (
                    <Markdown>{response}</Markdown>
                  ) : (
                    <span className="italic opacity-50">{t("cardForm.nothingToPreview")}</span>
                  )}
                </div>
              ) : (
                <Textarea
                  placeholder={t("cardForm.answerPlaceholder")}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-sm text-muted-foreground">
                {t("cardForm.optionsLabel")}
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
                {t("cardForm.addOption")}
              </Button>
              {options.some((o) => o.correct) && (
                <p className="text-xs text-muted-foreground">
                  {options.filter((o) => o.correct).length > 1
                    ? t("cardForm.multipleCorrect")
                    : t("cardForm.singleCorrect")}
                </p>
              )}
            </div>
          )}

          {/* Hint — collapsible */}
          {showHintInput ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">{t("common.hint")}</label>
                <button
                  type="button"
                  onClick={() => { setShowHintInput(false); setHint(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t("common.remove")}
                </button>
              </div>
              <Textarea
                placeholder={t("cardForm.hintPlaceholder")}
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                rows={2}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowHintInput(true)}
              className="self-start text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              {t("cardForm.addHint")}
            </button>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">{t("common.complexity")}</label>
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
                  {t(c.key)}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">{t("common.tags")}</label>
            <TagInput tags={tags} onChange={setTags} placeholder={t("deckForm.tagsPlaceholder")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!isValid}>
              {resolvedSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
