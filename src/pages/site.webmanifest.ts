// /site.webmanifest
import type { APIRoute } from 'astro';
import { SITE } from '../site.config';
import { withBase } from '../deploy.config';

export const GET: APIRoute = () =>
  Response.json({
    name: SITE.legalName,
    short_name: 'Ziggles',
    lang: 'fr',
    start_url: withBase('/'),
    display: 'standalone',
    background_color: SITE.themeColor,
    theme_color: SITE.themeColor,
    icons: [
      { src: withBase('/icons/icon-192.png'), sizes: '192x192', type: 'image/png' },
      { src: withBase('/icons/icon-512.png'), sizes: '512x512', type: 'image/png' },
      { src: withBase('/icons/icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  });
