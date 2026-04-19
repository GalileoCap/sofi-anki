import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

const NEXT: Record<string, string> = { en: "es", es: "en" };
const LABELS: Record<string, string> = { en: "EN", es: "ES" };

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(NEXT[lang] as "en" | "es")}
      title={`Language: ${LABELS[lang]}`}
    >
      <span className="text-xs">{LABELS[lang]}</span>
    </Button>
  );
}
