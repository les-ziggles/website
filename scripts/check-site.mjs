#!/usr/bin/env node
// Post-build audit of dist/: SEO, accessibility and CSP rules every page must follow.
//
//   bun run build && bun run check:site
//
// Uses the same SITE_URL and BASE_PATH environment variables as the build (src/deploy.config.ts).
//
// Fails (exit code 1) on errors; prints warnings without failing.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const SITE = (process.env.SITE_URL ?? 'https://ziggles.fr').replace(/\/+$/, '');
const BASE = `/${(process.env.BASE_PATH ?? '').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');
/** Root-relative path inside the build: drops the origin and the base path. */
const local = (url) => {
  let path = url.startsWith(SITE) ? url.slice(SITE.length) : url;
  if (BASE && (path === BASE || path.startsWith(`${BASE}/`))) path = path.slice(BASE.length) || '/';
  return path;
};
const errors = [];
const warnings = [];

const walk = (dir) => readdirSync(dir).flatMap((name) => (statSync(join(dir, name)).isDirectory() ? walk(join(dir, name)) : [join(dir, name)]));
const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));
const urlPathOf = (file) => '/' + relative(DIST, file).replace(/index\.html$/, '').replace(/\\/g, '/');

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map((m) => m[0]);
const meta = (html, key, value) => tags(html, 'meta').find((t) => attr(t, key) === value);
const decode = (text) => text.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

/** Does a root-relative URL resolve to a built file? */
function resolves(url) {
  const clean = decodeURIComponent(local(url).split(/[?#]/)[0]);
  if (clean.endsWith('/')) return existsSync(join(DIST, clean, 'index.html'));
  return existsSync(join(DIST, clean));
}

const pages = new Map();
const seenTitles = new Map();
const seenDescriptions = new Map();

for (const file of htmlFiles) {
  const path = urlPathOf(file);
  const html = readFileSync(file, 'utf8');
  const report = (list, message) => list.push(`${path}: ${message}`);
  const isNotFound = path === '/404.html';

  // Document basics
  if (!/<html\b[^>]*\slang="[a-z]{2}(-[A-Z]{2})?"/.test(html)) report(errors, 'missing or invalid <html lang>');
  const h1Count = tags(html, 'h1').length;
  if (h1Count !== 1) report(errors, `expected exactly one <h1>, found ${h1Count}`);
  if (!/<main\b[^>]*id="main-content"/.test(html)) report(errors, 'missing <main id="main-content"> (skip link target)');

  // Title and description
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  const description = decode(attr(meta(html, 'name', 'description') ?? '', 'content') ?? '');
  if (!title) report(errors, 'missing <title>');
  else if (title.length > 65) report(warnings, `title is ${title.length} characters (> 65)`);
  if (!description) report(errors, 'missing meta description');
  else if (description.length < 70 || description.length > 165) report(warnings, `description is ${description.length} characters`);
  if (!isNotFound) {
    if (seenTitles.has(title)) report(errors, `title duplicates ${seenTitles.get(title)}`);
    if (seenDescriptions.has(description)) report(errors, `description duplicates ${seenDescriptions.get(description)}`);
    seenTitles.set(title, path);
    seenDescriptions.set(description, path);
  }

  // Canonical and alternates
  const canonical = attr(tags(html, 'link').find((t) => attr(t, 'rel') === 'canonical') ?? '', 'href');
  const alternates = tags(html, 'link')
    .filter((t) => attr(t, 'rel') === 'alternate' && attr(t, 'hreflang'))
    .map((t) => ({ hreflang: attr(t, 'hreflang'), href: attr(t, 'href') }));
  if (!isNotFound) {
    if (canonical !== SITE + BASE + path) report(errors, `canonical is ${canonical}, expected ${SITE + BASE + path}`);
    if (!alternates.some((a) => a.hreflang === 'x-default')) report(errors, 'missing hreflang x-default');
    if (!alternates.some((a) => a.href === canonical)) report(errors, 'hreflang alternates do not include the page itself');
  }

  // Social cards
  for (const property of ['og:title', 'og:description', 'og:image', 'og:image:alt']) {
    if (!meta(html, 'property', property)) report(errors, `missing ${property}`);
  }
  if (!meta(html, 'name', 'twitter:card')) report(errors, 'missing twitter:card');
  const ogImage = attr(meta(html, 'property', 'og:image') ?? '', 'content');
  if (ogImage && (!ogImage.startsWith(SITE) || !resolves(ogImage))) report(errors, `og:image does not resolve: ${ogImage}`);

  // Structured data
  for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(block[1]);
    } catch {
      report(errors, 'invalid JSON-LD');
    }
  }
  if (!html.includes('"@type":"SportsOrganization"')) report(errors, 'missing Organization JSON-LD');

  // Content Security Policy
  if (!meta(html, 'http-equiv', 'content-security-policy')) report(errors, 'missing CSP <meta>');
  const styleAttributes = html.match(/<(?!style\b)[a-z]+\b[^>]*\sstyle="/g);
  if (styleAttributes) report(errors, `${styleAttributes.length} inline style="" attribute(s) would be blocked by the CSP`);

  // Images
  for (const img of tags(html, 'img')) {
    if (!/\salt(="[^"]*")?[\s>/]/.test(img)) report(errors, `<img> without alt: ${attr(img, 'src')}`);
    const src = attr(img, 'src');
    if (src?.startsWith('/') && !resolves(src)) report(errors, `image not found: ${src}`);
    if (src?.startsWith('/') && BASE && !src.startsWith(`${BASE}/`)) report(errors, `image misses the base path ${BASE}: ${src}`);
  }

  // Links
  for (const a of tags(html, 'a')) {
    const href = attr(a, 'href');
    if (!href) report(errors, '<a> without href');
    else if (href.startsWith('/') && BASE && !href.startsWith(`${BASE}/`)) report(errors, `link misses the base path ${BASE}: ${href}`);
    else if (href.startsWith('/') && !resolves(href)) report(errors, `broken internal link: ${href}`);
    else if (href.startsWith(SITE)) report(warnings, `absolute link to own site: ${href}`);
  }

  // Heading order: no skipped levels
  let previous = 0;
  for (const [, level] of html.matchAll(/<h([1-6])\b/g)) {
    if (previous && Number(level) > previous + 1) report(warnings, `heading level jumps from h${previous} to h${level}`);
    previous = Number(level);
  }

  pages.set(path, { alternates, canonical, isNotFound });
}

// Alternates must be reciprocal: every page an alternate points to must point back.
for (const [path, page] of pages) {
  if (page.isNotFound) continue;
  for (const { hreflang, href } of page.alternates) {
    const target = pages.get(local(href));
    if (!target) errors.push(`${path}: hreflang ${hreflang} points to a missing page ${href}`);
    else if (!target.alternates.some((a) => a.href === page.canonical)) errors.push(`${path}: ${href} does not link back (hreflang)`);
  }
}

// Sitemap, robots.txt and llms.txt
const sitemap = existsSync(join(DIST, 'sitemap-0.xml')) ? readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8') : '';
for (const [path, page] of pages) {
  if (!page.isNotFound && !sitemap.includes(`<loc>${SITE}${BASE}${path}</loc>`)) errors.push(`sitemap is missing ${path}`);
}
if (sitemap.includes('404')) errors.push('sitemap lists the 404 page');
for (const file of ['robots.txt', 'llms.txt', 'sitemap-index.xml', 'favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'site.webmanifest', 'social-card.jpg']) {
  if (!existsSync(join(DIST, file))) errors.push(`missing /${file}`);
}

console.log(`Checked ${htmlFiles.length} pages.`);
warnings.forEach((w) => console.warn(`warning  ${w}`));
errors.forEach((e) => console.error(`error    ${e}`));
console.log(`${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
