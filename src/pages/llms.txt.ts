// /llms.txt – a plain-text map of the site for language models and agents (https://llmstxt.org).
import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { SITE } from '../site.config';
import { LOCALES, LOCALE_META } from '../i18n/locales';
import { getPagesFor, parsePageId } from '../lib/pages';
import { canonicalUrl } from '../lib/urls';
import { capitalize, formatTime, weekdayName } from '../lib/format';

export const GET: APIRoute = async () => {
  const lines: string[] = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.name} is an Ultimate (flying disc) and Disc Golf club based in ${SITE.address.locality}, on the French Riviera (${SITE.address.region}, France), founded in ${SITE.foundingYear} and affiliated with the ${SITE.federation.name} (${SITE.federation.shortName}, club code ${SITE.federation.clubCode}). The site is in French (default) and English.`,
    '',
    `- Contact: ${SITE.email}`,
    `- Social: ${SITE.social.facebook}, ${SITE.social.instagram} (${SITE.social.instagramHandle})`,
    `- Registration happens on the federation member space: ${SITE.federation.memberSpaceUrl}`,
    '',
  ];

  for (const locale of LOCALES) {
    lines.push(`## Pages (${LOCALE_META[locale].label})`, '');
    for (const page of await getPagesFor(locale)) {
      const { key } = parsePageId(page.id);
      lines.push(`- [${page.data.title}](${canonicalUrl(key, locale)}): ${page.data.seo.description}`);
    }
    lines.push('');
  }

  lines.push('## Weekly sessions', '');
  for (const { data } of await getCollection('sessions')) {
    const venue = await getEntry(data.venue);
    const time = data.end ? `${formatTime(data.start, 'en')}–${formatTime(data.end, 'en')}` : `from ${formatTime(data.start, 'en')}`;
    const discipline = data.discipline === 'ultimate' ? 'Ultimate' : 'Disc Golf';
    lines.push(`- ${discipline}, ${data.title.en} (${data.audience.en}): ${capitalize(weekdayName(data.weekday, 'en'))} ${time}, ${venue?.data.name}, ${venue?.data.city}`);
  }

  lines.push('', '## Optional', '', `- [Sitemap](${SITE.url}/sitemap-index.xml)`, '');
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
