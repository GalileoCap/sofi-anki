export type Lang = "en" | "es";

const en_translations = {
  "deckList.title": "Your Decks",
};

const translations = {
  en: en_translations,
  es: {
    "deckList.title": "Tus mazos",
  },
} satisfies Record<Lang, Translation>;

export type Translation = typeof en_translations;
export type TranslationKey = keyof Translation;

export function translate<K extends TranslationKey>(
  lang: Lang,
  key: K,
): Translation[K] {
  return translations[lang][key];
}
