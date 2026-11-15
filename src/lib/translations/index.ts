import type { Lang } from "@/core/model";
import { en } from "@/lib/translations/en";
import { es } from "@/lib/translations/es";

export type Translation = typeof en;
export type TranslationKey = keyof Translation;

const translations: Record<Lang, Translation> = { en, es };

export const translate = (lang: Lang, key: TranslationKey): string => translations[lang][key];
