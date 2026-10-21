// /favicon.svg – the eagle head.
import type { APIRoute } from 'astro';
import eagle from '../assets/brand/ziggles-eagle-head.svg?raw';

export const GET: APIRoute = () => new Response(eagle, { headers: { 'Content-Type': 'image/svg+xml' } });
