// /robots.txt – everything is public; points crawlers to the sitemap and agents to llms.txt.
import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/urls';

export const GET: APIRoute = () =>
  new Response(
    ['User-agent: *', 'Allow: /', '', `Sitemap: ${absoluteUrl('/sitemap-index.xml')}`, `# Summary for language models: ${absoluteUrl('/llms.txt')}`, ''].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
