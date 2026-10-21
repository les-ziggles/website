// Locale-aware formatting of days, times, dates and prices.

import { LOCALE_META, type Locale } from '../i18n/locales';

const intlLocale = (locale: Locale) => LOCALE_META[locale].htmlLang;

/** ISO weekday (1 = Monday … 7 = Sunday) -> "lundi" / "Monday". */
export function weekdayName(weekday: number, locale: Locale): string {
  // 2024-01-01 was a Monday.
  const date = new Date(Date.UTC(2024, 0, weekday));
  return new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'long', timeZone: 'UTC' }).format(date);
}

/** "19:30" -> "19 h 30" (fr) / "7:30 pm" (en). */
export function formatTime(time: string, locale: Locale): string {
  const [hours, minutes] = time.split(':').map(Number);
  // Narrow no-break spaces keep "19 h 30" on one line.
  if (locale === 'fr') return `${hours} h ${String(minutes).padStart(2, '0')}`;
  const date = new Date(Date.UTC(2024, 0, 1, hours, minutes));
  return new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }).format(date);
}

/** Date -> "8 septembre 2026" / "8 September 2026". */
export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

/** 135 -> "135 €" / "€135". */
export function formatPrice(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), { style: 'currency', currency: 'EUR', maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(amount);
}

/** Capitalises the first letter (French weekday names are lowercase). */
export const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1);
