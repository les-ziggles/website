# Les Ziggles website

Static website of Les Ziggles, the Ultimate and Disc Golf club of Antibes, built with Astro 7 in French (default) and English, and published on GitHub Pages at <https://les-ziggles.github.io/website/>.

## Quickstart

Requires Node 22.22+ and [Bun](https://bun.sh).

```bash
bun install
```

```bash
bun run dev
```

Open <http://localhost:4321/> for the French site and <http://localhost:4321/en/> for the English one.

The Content Security Policy is only applied to production builds. To see the site exactly as it will be served:

```bash
bun run build
```

```bash
bun run preview
```

## What is in the site

- An animated landing page: the club badge with moving sea waves and a frisbee throw drawing its comic motion trail.
- Pages for the association, trainings, membership and prices, the online registration guide, Disc Golf, contact and the legal notice, in both languages. French URLs keep the paths of the former WordPress site (`/lassociation/`, `/entrainements/`, `/inscriptions/`, …); English ones are translated (`/en/trainings/`, `/en/membership/`, …).
- SEO: per-page titles and descriptions, canonical and hreflang links, Open Graph and Twitter cards, JSON-LD (`SportsOrganization`, `WebSite`, `WebPage`, `BreadcrumbList`, `SportsEvent` for weekly sessions, `OfferCatalog` for prices), `sitemap-index.xml`, `robots.txt` and `llms.txt`.
- Privacy: no cookies, no analytics, fonts served from the site, YouTube loaded only on click from `youtube-nocookie.com`.
- Footer palm trees swaying in the wind. Animations stay still when the visitor's system asks for reduced motion.

## Editing content

| What | Where |
|------|-------|
| Page text (one file per page and language) | `src/content/pages/fr/*.mdx`, `src/content/pages/en/*.mdx` |
| Weekly training sessions | `src/content/data/training-sessions.yaml` |
| Training venues and map links | `src/content/data/venues.yaml` |
| Membership prices | `src/content/data/membership-prices.yaml` |
| Buttons, navigation and other interface text | `src/i18n/ui.ts` |
| Emails, social accounts, association details (address, RNA), federation links | `src/site.config.ts` |
| URLs of every page in each language | `src/i18n/routes.ts` |

Each MDX page starts with its heading, introduction and SEO fields. The build fails with a clear message when an SEO title is longer than 65 characters, a description falls outside 70–165 characters, or a translation is missing.

MDX pages can use these components without importing them: `Band`, `ButtonGroup` (a row of buttons), `ButtonLink`, `Callout`, `ContentImage`, `FeatureCard`, `FeatureGrid`, `PartnerLogo`, `PriceList`, `TrainingSchedule`, `VideoFacade` (see `src/components/content/`).

After editing French text, run `bun run typography` to add the narrow no-break spaces French puts before `: ; ! ?` and inside `« »`.

### Adding a page

1. Add a route key with its French and English slugs to `src/i18n/routes.ts`.
2. Create `src/content/pages/fr/<key>.mdx` and `src/content/pages/en/<key>.mdx`.
3. To show it in the header or footer, add the key to `MAIN_NAV` or `FOOTER_NAV` in `src/i18n/ui.ts`, with a `nav.<key>` label in both languages.

The sitemap, hreflang links, language switcher and `llms.txt` pick the page up automatically.

## Design

- Colours come from the logo and are defined as CSS variables at the top of `src/styles/global.css` (`--ziggles-navy`, `--ziggles-gold`, `--ziggles-red`, …), followed by derived tints and semantic roles (`--color-text`, `--color-link`, …). Component styles are scoped in each `.astro` file.
- Fonts are configured in `astro.config.ts` and served from the site: Figtree (Open Font License) for text and headings, Alley-Oop for the ZIGGLES wordmark (it has no accented letters). To give headings their own typeface, add it to `fonts` and point `--font-headline` in `src/styles/global.css` to it.
- Brand SVGs in `src/assets/brand/` are generated from the master artwork in `design/`. After changing the artwork, run `bun run brand`.
- Images live in `src/assets/images/<section>/` and are named `<section>-<subject>.<ext>`. Use `<ContentImage>` (or `<Image densities={[1.5, 2]}>`), never a plain `<img>`.

## Checks

```bash
bun run verify
```

This runs the type checks, builds the site and audits every built page (`scripts/check-site.mjs`): unique titles and descriptions, one `<h1>`, canonical and reciprocal hreflang links, social cards, valid JSON-LD, CSP tag, no inline `style` attributes, image alt text, broken internal links and sitemap coverage.

## Deployment

Every push to `main` runs `.github/workflows/deploy-github-pages.yml`: it type-checks, builds and audits the site, then publishes `dist/` to GitHub Pages.

Where the site lives is set at build time by three environment variables, read in `src/deploy.config.ts`:

| Variable | Default | GitHub Pages |
|----------|---------|--------------|
| `SITE_URL` | `https://ziggles.fr` | `https://les-ziggles.github.io` (from the Pages settings) |
| `BASE_PATH` | `/` | `/website` (from the Pages settings) |
| `SITE_INDEXING` | indexed | `false` unless the repository variable `SITE_INDEXING` is `true` |

Page links, canonical URLs, the sitemap and links written in page content all follow the base path. To build the GitHub Pages version locally:

```bash
SITE_URL=https://les-ziggles.github.io BASE_PATH=/website bun run verify
```

To serve the site from `ziggles.fr`, add it as a custom domain in the repository's Pages settings and point the domain's DNS to GitHub Pages. The workflow then builds for the domain root, and setting `SITE_INDEXING` to `true` lets search engines index it.

GitHub Pages cannot send custom HTTP headers, so the Content Security Policy relies on the `<meta>` tag Astro generates in each page (it cannot include `frame-ancestors`).

## Before going live

- Check the licence of the Alley-Oop font (`src/assets/fonts/alley-oop-regular.woff2`) for web use: the file carries no author or licence information.
- The federation PDF guide linked from the registration guide is still hosted on the old WordPress site (`licenceGuidePdfUrl` in `src/site.config.ts`); copy it to `public/` if that site is closed.
