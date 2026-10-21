// /robots.txt – everything is public; points crawlers to the sitemap and agents to llms.txt.
import type { APIRoute } from 'astro';
import { publicUrl } from '../lib/urls';
import { DEPLOY } from '../deploy.config';

export const GET: APIRoute = () =>
  new Response(
    [
      'User-agent: *',
      DEPLOY.indexable ? 'Allow: /' : 'Disallow: /',
      '',
      `Sitemap: ${publicUrl('/sitemap-index.xml')}`,
      `# Summary for language models: ${publicUrl('/llms.txt')}`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
