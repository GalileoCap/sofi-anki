import { useState } from "react";

import { CardFace, UnderRule } from "@/components/card-face";
import { Field } from "@/components/field";
import { Markdown } from "@/components/markdown";
import { Key, Segmented } from "@/components/sticker";
import { TagInput } from "@/components/tag-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/language-context";
import type { CardDraft } from "@/core/decks";
import type { Card, CardType, Complexity, Deck } from "@/core/model";
import { newId } from "@/effects/clock";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

type CardFormProps = {
  /** The deck the card is in, shown on the card as it will study. */
  deck: Deck | undefined;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (card: CardDraft) => void;
  initial?: Card;
  dialogTitle?: string;
  submitLabel?: string;
};

type OptionRow = { id: string; text: string; correct: boolean };

const newOption = (): OptionRow => ({ id: newId(), text: "", correct: false });

const optionsOf = (card: Card | undefined): OptionRow[] =>
  card?.type === "choice" ? card.options.map(({ id, text, correct }) => ({ id, text, correct })) : [newOption(), newOption()];

/** Writing a card: its fields on the left and, beside them on a laptop, the card as it will study. ⌘ Enter saves. */
export function CardForm({ deck, trigger, open: controlledOpen, onOpenChange, onSubmit, initial, dialogTitle, submitLabel }: CardFormProps) {
  const { t } = useLanguage();
  const [ownOpen, setOwnOpen] = useState(false);
  const open = controlledOpen ?? ownOpen;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [complexity, setComplexity] = useState<Complexity>(initial?.complexity ?? "medium");
  const [cardType, setCardType] = useState<CardType>(initial?.type ?? "standard");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [hint, setHint] = useState(initial?.hint ?? "");
  const [response, setResponse] = useState(initial?.type === "standard" ? initial.response : "");
  const [options, setOptions] = useState<OptionRow[]>(() => optionsOf(initial));

  function changeOpen(next: boolean) {
    setOwnOpen(next);
    onOpenChange?.(next);
    if (next) {
      setTitle(initial?.title ?? "");
      setComplexity(initial?.complexity ?? "medium");
      setCardType(initial?.type ?? "standard");
      setTags(initial?.tags ?? []);
      setHint(initial?.hint ?? "");
      setResponse(initial?.type === "standard" ? initial.response : "");
      setOptions(optionsOf(initial));
    }
  }

  const setOption = (id: string, change: Partial<OptionRow>) => setOptions(options.map((o) => (o.id === id ? { ...o, ...change } : o)));

  const isValid =
    title.trim() !== "" &&
    (cardType === "standard" ? response.trim() !== "" : options.length >= 2 && options.every((o) => o.text.trim()) && options.some((o) => o.correct));

  function save() {
    if (!isValid) return;
    const common = { title: title.trim(), complexity, tags, ...(hint.trim() ? { hint: hint.trim() } : {}) };
    onSubmit(
      cardType === "standard"
        ? { ...common, type: "standard", response: response.trim() }
        : {
            ...common,
            type: "choice",
            multiSelect: options.filter((o) => o.correct).length > 1,
            options: options.map((o) => ({ id: o.id, text: o.text.trim(), correct: o.correct })),
          },
    );
    changeOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle ?? t("cardForm.newCard")}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => (e.preventDefault(), save())}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              save();
            }
          }}
          className="grid gap-x-8 gap-y-4 lg:grid-cols-2"
        >
          <div className={looks.form}>
            <Segmented
              label={t("cardForm.kind")}
              options={[
                { value: "standard", label: t("cardType.standard") },
                { value: "choice", label: t("cardType.choice") },
              ]}
              value={cardType}
              onChange={setCardType}
            />
            <Field label={t("cardForm.question")}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
            </Field>
            {cardType === "standard" ? (
              <Field label={t("cardForm.answer")}>
                <Textarea value={response} onChange={(e) => setResponse(e.target.value)} className="min-h-56 font-mono text-sm" />
              </Field>
            ) : (
              <Field label={t("cardForm.options")} group>
                {options.map((option, i) => (
                  <div key={option.id} className={looks.row}>
                    <input
                      type="checkbox"
                      checked={option.correct}
                      onChange={() => setOption(option.id, { correct: !option.correct })}
                      aria-label={t("cardForm.optionRight").replace("{n}", String(i + 1))}
                      className={looks.checkbox}
                    />
                    <Input
                      aria-label={t("cardForm.option").replace("{n}", String(i + 1))}
                      value={option.text}
                      onChange={(e) => setOption(option.id, { text: e.target.value })}
                    />
                    {options.length > 2 && (
                      <Button type="button" variant="ghost" onClick={() => setOptions(options.filter((o) => o.id !== option.id))}>
                        {t("common.remove")}
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" className="self-start" onClick={() => setOptions([...options, newOption()])}>
                  {t("cardForm.addOption")}
                </Button>
              </Field>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("cardForm.hint")}>
                <Input value={hint} onChange={(e) => setHint(e.target.value)} />
              </Field>
              <Field label={t("cardForm.difficulty")} group>
                <Segmented
                  label={t("cardForm.difficulty")}
                  options={(["easy", "medium", "hard"] as const).map((value) => ({ value, label: t(`complexity.${value}`) }))}
                  value={complexity}
                  onChange={setComplexity}
                />
              </Field>
            </div>
            <Field label={t("common.tags")}>
              <TagInput tags={tags} onChange={setTags} placeholder={t("deckForm.tagsPlaceholder")} />
            </Field>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className={cn(looks.muted, "font-bold")}>{t("cardForm.asItStudies")}</p>
            <CardFace deck={deck} title={title || " "}>
              {cardType === "standard"
                ? response.trim() && (
                    <UnderRule>
                      <Markdown>{response}</Markdown>
                    </UnderRule>
                  )
                : options.map((option) => (
                    <p key={option.id} className={option.correct ? "font-bold" : looks.muted}>
                      <Markdown inline>{option.text || " "}</Markdown>
                    </p>
                  ))}
            </CardFace>
          </div>

          <DialogFooter className="lg:col-span-2">
            <Button type="button" variant="ghost" onClick={() => changeOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!isValid}>
              {submitLabel ?? t("common.add")}
              <Key>⌘ Enter</Key>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
