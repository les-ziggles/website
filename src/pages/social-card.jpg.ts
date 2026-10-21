// /social-card.jpg – default Open Graph / Twitter image.
import type { APIRoute } from 'astro';
import { socialCard } from '../lib/brand-images';

export const GET: APIRoute = async () => new Response(new Uint8Array(await socialCard()), { headers: { 'Content-Type': 'image/jpeg' } });
