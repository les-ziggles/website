// /apple-touch-icon.png – home screen icon on iOS (opaque background required).
import type { APIRoute } from 'astro';
import { BRAND_NAVY, eagleIcon } from '../lib/brand-images';

export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await eagleIcon(180, { background: BRAND_NAVY, padding: 0.12 })), { headers: { 'Content-Type': 'image/png' } });
