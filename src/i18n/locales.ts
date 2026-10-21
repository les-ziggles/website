// Locales of the site. French is the default and lives at the root (/), English under /en/.
// Kept free of Astro imports so astro.config.ts can use it too.

export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'fr';

export const LOCALE_META: Record<Locale, { label: string; htmlLang: string; hreflang: string; ogLocale: string }> = {
  fr: { label: 'Français', htmlLang: 'fr-FR', hreflang: 'fr', ogLocale: 'fr_FR' },
  en: { label: 'English', htmlLang: 'en-GB', hreflang: 'en', ogLocale: 'en_GB' },
};

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);

/** Locale of the page being rendered: `resolveLocale(Astro.currentLocale)`. */
export const resolveLocale = (value: unknown): Locale => (isLocale(value) ? value : DEFAULT_LOCALE);
