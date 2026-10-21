// schema.org JSON-LD builders. Rendered by <StructuredData> in the page <head>.

import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { SITE } from '../site.config';
import { LOCALES, LOCALE_META, type Locale } from '../i18n/locales';
import { useTranslations } from '../i18n/ui';
import { type RouteKey } from '../i18n/routes';
import { absoluteUrl, canonicalUrl } from './urls';

type JsonLd = Record<string, unknown>;

const ORGANIZATION_ID = `${SITE.url}/#organization`;
const WEBSITE_ID = `${SITE.url}/#website`;

const postalAddress = {
  '@type': 'PostalAddress',
  addressLocality: SITE.address.locality,
  postalCode: SITE.address.postalCode,
  addressRegion: SITE.address.region,
  addressCountry: SITE.address.country,
};

/** The club, as a sports organisation (schema.org subtype of Organization). */
export function organization(locale: Locale): JsonLd {
  const t = useTranslations(locale);
  return {
    '@type': 'SportsOrganization',
    '@id': ORGANIZATION_ID,
    name: SITE.name,
    alternateName: ['Ziggles', SITE.legalName],
    description: t('site.tagline'),
    url: absoluteUrl('/'),
    logo: { '@type': 'ImageObject', url: absoluteUrl('/icons/icon-512.png'), width: 512, height: 512 },
    image: absoluteUrl('/social-card.jpg'),
    email: SITE.emails.board,
    foundingDate: String(SITE.foundingYear),
    sport: ['Ultimate', 'Disc golf'],
    address: postalAddress,
    areaServed: { '@type': 'AdministrativeArea', name: SITE.address.region },
    memberOf: { '@type': 'SportsOrganization', name: SITE.federation.name, alternateName: SITE.federation.shortName, url: SITE.federation.url },
    sameAs: [SITE.social.facebook, SITE.social.x],
  };
}

export function website(): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: absoluteUrl('/'),
    name: SITE.name,
    inLanguage: LOCALES.map((l) => LOCALE_META[l].htmlLang),
    publisher: { '@id': ORGANIZATION_ID },
  };
}

export function webPage(key: RouteKey, locale: Locale, name: string, description: string): JsonLd {
  const url = canonicalUrl(key, locale);
  return {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: LOCALE_META[locale].htmlLang,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORGANIZATION_ID },
  };
}

export function breadcrumb(key: RouteKey, locale: Locale, name: string): JsonLd {
  const t = useTranslations(locale);
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('nav.home'), item: canonicalUrl('home', locale) },
      { '@type': 'ListItem', position: 2, name, item: canonicalUrl(key, locale) },
    ],
  };
}

const ISO_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Weekly sessions as recurring events. */
export async function trainingEvents(locale: Locale, discipline: CollectionEntry<'sessions'>['data']['discipline']): Promise<JsonLd[]> {
  const sessions = (await getCollection('sessions')).filter((s) => s.data.discipline === discipline);
  return Promise.all(
    sessions.map(async ({ data }) => {
      const venue = await getEntry(data.venue);
      return {
        '@type': 'SportsEvent',
        name: `${data.title[locale]} – ${SITE.name}`,
        sport: discipline === 'ultimate' ? 'Ultimate' : 'Disc golf',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        organizer: { '@id': ORGANIZATION_ID },
        audience: { '@type': 'Audience', audienceType: data.audience[locale] },
        location: {
          '@type': 'Place',
          name: venue?.data.name,
          address: { '@type': 'PostalAddress', addressLocality: venue?.data.city, addressCountry: 'FR' },
        },
        ...(data.resumesOn && { startDate: data.resumesOn.toISOString().slice(0, 10) }),
        eventSchedule: {
          '@type': 'Schedule',
          repeatFrequency: 'P1W',
          byDay: `https://schema.org/${ISO_DAYS[data.weekday - 1]}`,
          startTime: data.start,
          ...(data.end && { endTime: data.end }),
          scheduleTimezone: 'Europe/Paris',
        },
      };
    }),
  );
}

/** Membership prices as a catalogue of offers. */
export async function membershipOffers(locale: Locale): Promise<JsonLd> {
  const prices = await getCollection('prices');
  return {
    '@type': 'OfferCatalog',
    name: locale === 'fr' ? `Licences ${prices[0]?.data.season}` : `Memberships ${prices[0]?.data.season}`,
    itemListElement: prices.map(({ data }) => ({
      '@type': 'Offer',
      name: data.label[locale],
      price: data.amount,
      priceCurrency: 'EUR',
      seller: { '@id': ORGANIZATION_ID },
      url: canonicalUrl('membership', locale),
    })),
  };
}

/** Wraps nodes into one JSON-LD document. */
export const graph = (nodes: JsonLd[]) => ({ '@context': 'https://schema.org', '@graph': nodes });
