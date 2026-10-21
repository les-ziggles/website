// Single source of truth for page URLs in each language.
//
// A page is identified by a route key (e.g. "trainings"). Its content lives in
// src/content/pages/<locale>/<key>.mdx and its URL is built from the slug below.
// French slugs keep the paths of the former WordPress site.
//
// To add a page: add a key here, then one MDX file per locale.
// Used by the page routes, the language switcher, hreflang links and the sitemap.

import { DEFAULT_LOCALE, LOCALES, type Locale } from './locales';

export const ROUTES = {
  home: { fr: '', en: '' },
  association: { fr: 'lassociation', en: 'association' },
  trainings: { fr: 'entrainements', en: 'trainings' },
  membership: { fr: 'inscriptions', en: 'membership' },
  'registration-guide': { fr: 'inscription-en-ligne', en: 'online-registration' },
  'disc-golf': { fr: 'disc-golf', en: 'disc-golf' },
  contact: { fr: 'contact', en: 'contact' },
  'legal-notice': { fr: 'mentions-legales', en: 'legal-notice' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof ROUTES;
export const ROUTE_KEYS = Object.keys(ROUTES) as RouteKey[];

export const isRouteKey = (value: string): value is RouteKey => value in ROUTES;

/** Root-relative URL of a page, with trailing slash: "/entrainements/", "/en/trainings/", "/en/". */
export function pathFor(key: RouteKey, locale: Locale): string {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  const slug = ROUTES[key][locale];
  return `${prefix}/${slug ? `${slug}/` : ''}`;
}

/** Finds which page and language a root-relative path belongs to. */
export function routeForPath(path: string): { key: RouteKey; locale: Locale } | undefined {
  const normalized = path.endsWith('/') ? path : `${path}/`;
  for (const key of ROUTE_KEYS) {
    for (const locale of LOCALES) {
      if (pathFor(key, locale) === normalized) return { key, locale };
    }
  }
  return undefined;
}

/** Slug segment(s) used by the dynamic page routes ([...slug].astro); undefined for the home page. */
export const slugParam = (key: RouteKey, locale: Locale): string | undefined => ROUTES[key][locale] || undefined;
