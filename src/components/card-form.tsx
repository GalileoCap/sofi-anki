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
import type { Complexity } from "@/types";
import { cn } from "@/lib/utils";

const COMPLEXITIES: { value: Complexity; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

interface CardFormProps {
  trigger: React.ReactNode;
  onSubmit: (title: string, response: string, complexity: Complexity) => void;
  initialTitle?: string;
  initialResponse?: string;
  initialComplexity?: Complexity;
  dialogTitle?: string;
  submitLabel?: string;
}

export function CardForm({
  trigger,
  onSubmit,
  initialTitle = "",
  initialResponse = "",
  initialComplexity = "medium",
  dialogTitle = "New Card",
  submitLabel = "Add",
}: CardFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [response, setResponse] = useState(initialResponse);
  const [complexity, setComplexity] = useState<Complexity>(initialComplexity);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setTitle(initialTitle);
      setResponse(initialResponse);
      setComplexity(initialComplexity);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const r = response.trim();
    if (!t || !r) return;
    onSubmit(t, r, complexity);
    setTitle("");
    setResponse("");
    setComplexity("medium");
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
