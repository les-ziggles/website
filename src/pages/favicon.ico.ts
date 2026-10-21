// /favicon.ico – for browsers and tools that only look for the legacy icon.
import type { APIRoute } from 'astro';
import { eagleIcon, pngsToIco } from '../lib/brand-images';

export const GET: APIRoute = async () => {
  const sizes = [16, 32, 48];
  const images = await Promise.all(sizes.map(async (size) => ({ size, png: await eagleIcon(size, { padding: 0 }) })));
  return new Response(new Uint8Array(pngsToIco(images)), { headers: { 'Content-Type': 'image/x-icon' } });
};
