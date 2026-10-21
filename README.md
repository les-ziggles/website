# Les Ziggles website

Static website of Les Ziggles, the Ultimate and Disc Golf club of Antibes, built with Astro 7 in French (default) and English, and deployed to S3 + CloudFront behind Cloudflare.

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
- Pages for trainings, membership and prices, the online registration guide, Disc Golf, contact and the legal notice, in both languages. French URLs keep the paths of the former WordPress site (`/entrainements/`, `/inscriptions/`, …); English ones are translated (`/en/trainings/`, `/en/membership/`, …).
- SEO: per-page titles and descriptions, canonical and hreflang links, Open Graph and Twitter cards, JSON-LD (`SportsOrganization`, `WebSite`, `WebPage`, `BreadcrumbList`, `SportsEvent` for weekly sessions, `OfferCatalog` for prices), `sitemap-index.xml`, `robots.txt` and `llms.txt`.
- Privacy: no cookies, no analytics, fonts served from the site, YouTube loaded only on click from `youtube-nocookie.com`.
- Footer palm trees swaying in the wind; a button pauses every animation (also off by default when the visitor's system asks for reduced motion).

## Editing content

| What | Where |
|------|-------|
| Page text (one file per page and language) | `src/content/pages/fr/*.mdx`, `src/content/pages/en/*.mdx` |
| Weekly training sessions | `src/content/data/training-sessions.yaml` |
| Training venues and map links | `src/content/data/venues.yaml` |
| Membership prices | `src/content/data/membership-prices.yaml` |
| Buttons, navigation and other interface text | `src/i18n/ui.ts` |
| Emails, social accounts, federation links | `src/site.config.ts` |
| URLs of every page in each language | `src/i18n/routes.ts` |

Each MDX page starts with its heading, introduction and SEO fields. The build fails with a clear message when an SEO title is longer than 65 characters, a description falls outside 70–165 characters, or a translation is missing.

MDX pages can use these components without importing them: `Band`, `ButtonLink`, `Callout`, `ContentImage`, `FeatureCard`, `FeatureGrid`, `PartnerLogo`, `PriceList`, `TrainingSchedule`, `VideoFacade` (see `src/components/content/`).

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

The build output in `dist/` is a set of static files.

```bash
ZIGGLES_BUCKET=<bucket> ZIGGLES_DISTRIBUTION_ID=<distribution id> bun run deploy
```

`deploy/deploy.sh` uploads `dist/` with long-lived caching for fingerprinted assets (`/_astro/`) and revalidation for everything else, then invalidates CloudFront. It needs the AWS CLI with write access to the bucket.

CloudFront setup:

- Origin: the private S3 bucket through Origin Access Control.
- Viewer request function: `deploy/cloudfront-viewer-request.js` (maps `/entrainements/` to `/entrainements/index.html` and adds missing trailing slashes).
- Response headers policy: `deploy/response-headers-policy.json` (HSTS, `frame-ancestors`, `nosniff`, referrer and permissions policies). The rest of the CSP is a `<meta>` tag generated by Astro in each page.
- Custom error responses: map 403 and 404 to `/404.html` with status 404.

Cloudflare setup:

- SSL/TLS mode **Full (strict)**, proxied DNS record pointing to the CloudFront distribution.
- Turn off features that inject inline scripts, which the CSP blocks: **Email Address Obfuscation**, **Rocket Loader** and automatic **Web Analytics** injection.

## Before going live

- Fill in the publisher details marked "à compléter" in `src/content/pages/fr/legal-notice.mdx` and `en/legal-notice.mdx`.
- Check the licence of the Alley-Oop font (`src/assets/fonts/alley-oop-regular.woff2`) for web use: the file carries no author or licence information.
- The federation PDF guide linked from the registration guide is still hosted on the old WordPress site (`licenceGuidePdfUrl` in `src/site.config.ts`); copy it to `public/` if that site is closed.
- Confirm the domain in `src/site.config.ts` (`https://ziggles.fr`).
