// Content collections.
//
// pages     – one MDX file per page and language: src/content/pages/<locale>/<route-key>.mdx
// sessions  – weekly training sessions (Ultimate and Disc Golf), src/content/data/training-sessions.yaml
// venues    – where we play, src/content/data/venues.yaml
// prices    – membership prices for the current season, src/content/data/membership-prices.yaml
// events    – upcoming events of the public calendars, read from their iCal feeds at build time
//
// SEO fields are validated here so a too-long title or description fails the build with a clear message.

import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { calendarLoader } from './lib/calendar-loader';
import { SITE } from './site.config';

/** A text in both languages. Strict, so an unquoted comma in YAML (`{ fr: a, b, en: c }`) fails the build. */
const localized = z.object({ fr: z.string(), en: z.string() }).strict();

const pages = defineCollection({
  loader: glob({ pattern: '*/*.mdx', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      /** Visible page heading (h1). */
      title: z.string(),
      /** Short introduction shown under the heading. */
      lede: z.string().optional(),
      seo: z.object({
        title: z.string().min(20).max(65, 'Keep SEO titles under 65 characters so they are not truncated in results'),
        description: z.string().min(70).max(165, 'Keep meta descriptions under 165 characters'),
      }),
      /** Illustration shown beside the page title, e.g. an eagle head on the club subpages. */
      emblem: image().optional(),
      /** Image shown at the top of the page and used for social cards. */
      cover: z
        .object({
          image: image(),
          alt: z.string(),
        })
        .optional(),
    }),
});

const venues = defineCollection({
  loader: file('src/content/data/venues.yaml'),
  schema: z.object({
    name: z.string(),
    city: z.string(),
    /** Link opening the venue in a map application. */
    mapUrl: z.url().optional(),
  }),
});

const sessions = defineCollection({
  loader: file('src/content/data/training-sessions.yaml'),
  schema: z.object({
    discipline: z.enum(['ultimate', 'disc-golf']),
    setting: z.enum(['indoor', 'outdoor']),
    title: localized,
    audience: localized,
    /** ISO weekday: 1 = Monday … 7 = Sunday. */
    weekday: z.number().int().min(1).max(7),
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    venue: reference('venues'),
    /** First session of the season. */
    resumesOn: z.coerce.date().optional(),
    note: localized.optional(),
    /** Playing surface, and the shoes it calls for. */
    field: localized.optional(),
    shoes: localized.optional(),
  }),
});

const prices = defineCollection({
  loader: file('src/content/data/membership-prices.yaml'),
  schema: z.object({
    season: z.string(),
    label: localized,
    /** Price in euros. */
    amount: z.number(),
    /** Free for Pass’Sport beneficiaries. */
    freeWithPassSport: z.boolean().default(false),
    /** Supplement added to another licence rather than a licence of its own. */
    supplement: z.boolean().default(false),
  }),
});

const events = defineCollection({
  loader: calendarLoader({ club: SITE.calendars.club.ics, trainings: SITE.calendars.trainings.ics }),
  schema: z.object({
    calendar: z.enum(['club', 'trainings']),
    title: z.string(),
    start: z.date(),
    end: z.date(),
    allDay: z.boolean(),
    location: z.string().optional(),
    url: z.url().optional(),
  }),
});

export const collections = { pages, venues, sessions, prices, events };
