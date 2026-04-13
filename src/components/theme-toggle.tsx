import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

const ICONS: Record<string, string> = {
  light: "\u2600\uFE0F",
  dark: "\uD83C\uDF19",
  system: "\uD83D\uDCBB",
};

const LABELS: Record<string, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      title={`Theme: ${LABELS[theme]}`}
    >
      <span className="mr-1">{ICONS[theme]}</span>
      <span className="text-xs">{LABELS[theme]}</span>
    </Button>
  );
}
