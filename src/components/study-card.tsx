import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Card as CardType } from "@/types";

interface StudyCardProps {
  card: CardType;
  revealed: boolean;
  onReveal: () => void;
  onNext: () => void;
  onSkip: () => void;
  onSaveForLater: () => void;
}

export function StudyCard({
  card,
  revealed,
  onReveal,
  onNext,
  onSkip,
  onSaveForLater,
}: StudyCardProps) {
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardContent className="flex flex-col items-center gap-6 text-center">
        <p className="text-lg font-medium text-foreground">{card.title}</p>

        {revealed && (
          <div className="w-full rounded-lg bg-muted/50 p-4">
            <p className="text-muted-foreground whitespace-pre-wrap">{card.response}</p>
          </div>
        )}

        {!revealed ? (
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={onReveal}>Reveal Answer</Button>
            <Button variant="outline" onClick={onSkip}>
              Skip
            </Button>
            <Button variant="secondary" onClick={onSaveForLater}>
              Save For Later
            </Button>
          </div>
        ) : (
          <Button onClick={onNext} className="w-full max-w-xs">
            Next
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
