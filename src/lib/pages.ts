// Access to the `pages` collection by route key and locale.

import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { LOCALES, isLocale, type Locale } from '../i18n/locales';
import { ROUTE_KEYS, isRouteKey, slugParam, type RouteKey } from '../i18n/routes';

export type PageEntry = CollectionEntry<'pages'>;

/** "fr/trainings" -> { locale: "fr", key: "trainings" } */
export function parsePageId(id: string): { locale: Locale; key: RouteKey } {
  const [locale, key] = id.split('/');
  if (!isLocale(locale) || !key || !isRouteKey(key)) {
    throw new Error(`Content file "${id}" must be src/content/pages/<${LOCALES.join('|')}>/<route key from src/i18n/routes.ts>.mdx`);
  }
  return { locale, key };
}

export async function getPage(key: RouteKey, locale: Locale): Promise<PageEntry> {
  const page = await getEntry('pages', `${locale}/${key}`);
  if (!page) throw new Error(`Missing content file src/content/pages/${locale}/${key}.mdx`);
  return page;
}

/** All pages of one language, in the route map order. Fails the build if a translation is missing. */
export async function getPagesFor(locale: Locale): Promise<PageEntry[]> {
  const entries = await getCollection('pages');
  for (const entry of entries) parsePageId(entry.id);
  const missing = LOCALES.flatMap((l) => ROUTE_KEYS.filter((key) => !entries.some((e) => e.id === `${l}/${key}`)).map((key) => `${l}/${key}.mdx`));
  if (missing.length) throw new Error(`Missing page content: ${missing.join(', ')}`);
  return ROUTE_KEYS.map((key) => entries.find((e) => e.id === `${locale}/${key}`)!);
}

/** getStaticPaths() result for the page routes of one language. */
export async function pageStaticPaths(locale: Locale) {
  const pages = await getPagesFor(locale);
  return pages.map((page) => {
    const { key } = parsePageId(page.id);
    return { params: { slug: slugParam(key, locale) }, props: { page, routeKey: key, locale } };
  });
}
