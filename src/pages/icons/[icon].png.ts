// /icons/icon-192.png, /icons/icon-512.png, /icons/icon-maskable-512.png – web app manifest icons.
import type { APIRoute, GetStaticPaths } from 'astro';
import { BRAND_NAVY, eagleIcon } from '../../lib/brand-images';

const ICONS = {
  'icon-192': { size: 192, padding: 0.06 },
  'icon-512': { size: 512, padding: 0.06 },
  // Maskable icons keep the artwork inside the central 80% safe zone.
  'icon-maskable-512': { size: 512, padding: 0.2, background: BRAND_NAVY },
} as const;

export const getStaticPaths = (() => Object.keys(ICONS).map((icon) => ({ params: { icon } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const { size, ...options } = ICONS[params.icon as keyof typeof ICONS];
  return new Response(new Uint8Array(await eagleIcon(size, options)), { headers: { 'Content-Type': 'image/png' } });
};
