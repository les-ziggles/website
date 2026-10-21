// Absolute URLs and per-page alternates (canonical, hreflang).

import { SITE } from '../site.config';
import { DEFAULT_LOCALE, LOCALES, LOCALE_META, type Locale } from '../i18n/locales';
import { pathFor, type RouteKey } from '../i18n/routes';

export const absoluteUrl = (path: string) => new URL(path, SITE.url).href;

export const canonicalUrl = (key: RouteKey, locale: Locale) => absoluteUrl(pathFor(key, locale));

/** hreflang alternates of a page, including x-default (the French version). */
export function alternateLinks(key: RouteKey) {
  return [
    ...LOCALES.map((locale) => ({ hreflang: LOCALE_META[locale].hreflang, href: canonicalUrl(key, locale) })),
    { hreflang: 'x-default', href: canonicalUrl(key, DEFAULT_LOCALE) },
  ];
}

/** True for links leaving the site. */
export const isExternal = (href: string) => /^https?:\/\//.test(href) && !href.startsWith(SITE.url);
