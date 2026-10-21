// Where the site is published. Read at build time from environment variables, so the same code can
// be built for the production domain or for a preview such as GitHub Pages
// (see .github/workflows/deploy-github-pages.yml).
//
//   SITE_URL       origin of the published site            default: https://ziggles.fr
//   BASE_PATH      sub-path the site is served under        default: /         (GitHub Pages: /website)
//   SITE_INDEXING  "false" asks search engines not to index  default: indexed

const env = globalThis.process?.env ?? {};

const basePath = `/${(env.BASE_PATH ?? '').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');

export const DEPLOY = {
  siteUrl: (env.SITE_URL ?? 'https://ziggles.fr').replace(/\/+$/, ''),
  /** "" for a site at the domain root, "/website" for a project page. No trailing slash. */
  basePath,
  indexable: env.SITE_INDEXING !== 'false',
};

/** Prefixes a root-relative path with the base path: "/entrainements/" -> "/website/entrainements/". */
export const withBase = (path: string) => (path.startsWith('/') && !path.startsWith('//') ? `${DEPLOY.basePath}${path}` : path);

/** Removes the base path from a root-relative path (inverse of withBase). */
export const withoutBase = (path: string) =>
  DEPLOY.basePath && path.startsWith(`${DEPLOY.basePath}/`) ? path.slice(DEPLOY.basePath.length) : path;
