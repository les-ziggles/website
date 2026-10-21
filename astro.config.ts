import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/site.config';
import { DEFAULT_LOCALE, LOCALES, LOCALE_META } from './src/i18n/locales';
import { pathFor, routeForPath } from './src/i18n/routes';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: SITE.url,
  // Static files on S3 + CloudFront: /entrainements/ is served from /entrainements/index.html.
  trailingSlash: 'always',
  build: { format: 'directory' },

  i18n: {
    locales: [...LOCALES],
    defaultLocale: DEFAULT_LOCALE,
    routing: { prefixDefaultLocale: false },
  },

  integrations: [
    mdx(),
    sitemap({
      // Pages use translated slugs (/entrainements/ <-> /en/trainings/), so alternates come from the route map.
      serialize(item) {
        const route = routeForPath(new URL(item.url).pathname);
        if (!route) return item;
        const links = LOCALES.map((locale) => ({ lang: LOCALE_META[locale].hreflang, url: SITE.url + pathFor(route.key, locale) }));
        links.push({ lang: 'x-default', url: SITE.url + pathFor(route.key, DEFAULT_LOCALE) });
        return { ...item, links };
      },
    }),
  ],

  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },

  // No code blocks on the site; Shiki's inline styles would also conflict with the CSP.
  markdown: { syntaxHighlight: false },

  // Fonts are downloaded at build time and served from the site itself (no third-party font requests).
  fonts: [
    {
      // Variable font files from the @fontsource-variable/figtree package (version pinned by the lockfile).
      provider: fontProviders.local(),
      name: 'Figtree',
      cssVariable: '--font-body',
      options: {
        variants: [
          {
            src: ['./node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2'],
            weight: '300 900',
            style: 'normal',
            unicodeRange: ['U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'],
          },
          {
            src: ['./node_modules/@fontsource-variable/figtree/files/figtree-latin-ext-wght-normal.woff2'],
            weight: '300 900',
            style: 'normal',
            unicodeRange: ['U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'],
          },
        ],
      },
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      // Alley-Oop has no accented letters: keep it for accent-free display words (the ZIGGLES wordmark).
      provider: fontProviders.local(),
      name: 'Alley Oop',
      cssVariable: '--font-display',
      options: { variants: [{ src: ['./src/assets/fonts/alley-oop-regular.woff2'], weight: 400, style: 'normal' }] },
      fallbacks: ['Impact', 'sans-serif'],
    },
  ],

  // Content Security Policy, rendered as a <meta> tag in every page. Astro adds hashes for its own
  // scripts and styles. frame-ancestors cannot be set in a <meta> tag: send it as a CloudFront header.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "manifest-src 'self'",
        "media-src 'self'",
        'frame-src https://www.youtube-nocookie.com',
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        'upgrade-insecure-requests',
      ],
    },
  },
});
