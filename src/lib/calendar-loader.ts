// Content loader for the public calendars (src/site.config.ts → calendars): downloads their iCal feeds at
// build time and stores recent and upcoming events, recurring events expanded into their occurrences.
//
// When a feed cannot be read, a CI build fails (the site already online stays as it is) while a local
// build keeps the events it loaded last time, so working offline still works.

import ICAL from 'ical.js';
import type { Loader } from 'astro/loaders';

export type CalendarKey = 'club' | 'trainings';

export interface CalendarEvent {
  calendar: CalendarKey;
  title: string;
  /** Instant for timed events; midnight UTC of the day for all-day events. */
  start: Date;
  /** Exclusive end: for all-day events, midnight UTC of the day after the last one. */
  end: Date;
  allDay: boolean;
  location?: string;
  /** Page of the event: yaentrainement.fr session, or the first link of a club event's description. */
  url?: string;
}

/** Recurring events are expanded this far ahead. */
const HORIZON_DAYS = 400;
/** Past events are kept this long, so the month grid shows what happened earlier in the current month. */
const HISTORY_DAYS = 42;

/** Training titles all start with the club name ("Ziggles: Indoor"). */
const TITLE_PREFIX = /^Ziggles\s*:\s*/i;

export function calendarLoader(feeds: Record<CalendarKey, string>): Loader {
  return {
    name: 'ziggles-calendars',
    load: async ({ store, logger, parseData, generateDigest }) => {
      const now = new Date();
      const events: [string, CalendarEvent][] = [];
      try {
        for (const [calendar, url] of Object.entries(feeds) as [CalendarKey, string][]) {
          const response = await fetch(url, { headers: { accept: 'text/calendar' } });
          if (!response.ok) throw new Error(`${url} answered HTTP ${response.status}`);
          events.push(...parseFeed(await response.text(), calendar, now));
        }
      } catch (error) {
        if (process.env.CI) throw error;
        logger.warn(`Calendar feeds unavailable, keeping the events loaded previously. ${error}`);
        return;
      }

      store.clear();
      for (const [id, event] of events) {
        const data = await parseData({ id, data: { ...event } });
        store.set({ id, data, digest: generateDigest(data) });
      }
      logger.info(`Loaded ${events.length} calendar events.`);
    },
  };
}

function parseFeed(ics: string, calendar: CalendarKey, now: Date): [string, CalendarEvent][] {
  const root = new ICAL.Component(ICAL.parse(ics));
  for (const timezone of root.getAllSubcomponents('vtimezone')) ICAL.TimezoneService.register(timezone);

  // Modified occurrences of a recurring event (RECURRENCE-ID) are attached to their series.
  const components = root.getAllSubcomponents('vevent');
  const series = components.filter((vevent) => !vevent.hasProperty('recurrence-id')).map((vevent) => new ICAL.Event(vevent));
  for (const vevent of components.filter((component) => component.hasProperty('recurrence-id'))) {
    const exception = new ICAL.Event(vevent);
    series.find((event) => event.uid === exception.uid)?.relateException(exception);
  }

  const horizon = ICAL.Time.fromJSDate(new Date(now.getTime() + HORIZON_DAYS * 86_400_000), true);
  const since = new Date(now.getTime() - HISTORY_DAYS * 86_400_000);
  const events: [string, CalendarEvent][] = [];
  const add = (event: ICAL.Event, start: ICAL.Time, end: ICAL.Time, id: string) => {
    if (String(event.component.getFirstPropertyValue('status') ?? '').toUpperCase() === 'CANCELLED') return;
    const allDay = start.isDate;
    const startDate = toDate(start);
    const endDate = end ? toDate(end) : allDay ? new Date(startDate.getTime() + 86_400_000) : startDate;
    if (endDate <= since) return;
    events.push([
      id,
      {
        calendar,
        title: event.summary.replace(TITLE_PREFIX, '').trim(),
        start: startDate,
        end: endDate,
        allDay,
        location: event.location?.trim() || undefined,
        url: eventUrl(event),
      },
    ]);
  };

  for (const event of series) {
    const id = `${calendar}-${event.uid}`;
    if (!event.isRecurring()) {
      add(event, event.startDate, event.endDate, id);
      continue;
    }
    const occurrences = event.iterator();
    for (let next = occurrences.next(); next && next.compare(horizon) < 0; next = occurrences.next()) {
      const occurrence = event.getOccurrenceDetails(next);
      add(occurrence.item, occurrence.startDate, occurrence.endDate, `${id}-${next.toString()}`);
    }
  }
  return events;
}

/** All-day dates become midnight UTC so they never shift by a day, whatever the build machine's zone. */
const toDate = (time: ICAL.Time) => (time.isDate ? new Date(Date.UTC(time.year, time.month - 1, time.day)) : time.toJSDate());

function eventUrl(event: ICAL.Event): string | undefined {
  const url = event.component.getFirstPropertyValue('url');
  if (typeof url === 'string' && url) return url;
  return event.description?.match(/https?:\/\/\S+/)?.[0];
}
