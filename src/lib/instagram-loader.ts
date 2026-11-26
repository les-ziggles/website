// Content loader for the club's Instagram feed (src/site.config.ts -> instagramFeedUrl):
// downloads the latest posts from Behold at build time and mirrors their images locally
// as 640x640 WebPs so visitors never contact third-party servers.
//
// When the feed cannot be read, a CI build fails (the site already online stays as it is) while a
// local build keeps the posts it loaded last time, so working offline still works.

import sharp from 'sharp';
import type { Loader } from 'astro/loaders';

export type InstagramMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';

export interface InstagramPost {
  permalink: string;
  timestamp: Date;
  mediaType: InstagramMediaType;
  caption: string;
  imageBase64: string;
}

const MAX_POSTS = 6;
const LOCAL_CACHE_TTL_MS = 10 * 60_000;

interface BeholdPost {
  id: string;
  permalink: string;
  timestamp: string;
  mediaType: InstagramMediaType;
  caption?: string;
  prunedCaption?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  sizes?: {
    medium?: { mediaUrl?: string };
    large?: { mediaUrl?: string };
  };
}

interface BeholdFeed {
  posts?: BeholdPost[];
}

export function instagramLoader(feedUrl: string): Loader {
  return {
    name: 'ziggles-instagram',
    load: async ({ store, meta, logger, parseData, generateDigest }) => {
      if (!process.env.CI && store.keys().length > 0) {
        const lastFetched = Number(meta.get('fetchedAt') ?? 0);
        if (Date.now() - lastFetched < LOCAL_CACHE_TTL_MS) {
          logger.info(`Using cached Instagram posts (${store.keys().length}).`);
          return;
        }
      }

      const entries: [string, InstagramPost][] = [];
      try {
        const response = await fetch(feedUrl, { headers: { accept: 'application/json' } });
        if (!response.ok) throw new Error(`${feedUrl} answered HTTP ${response.status}`);
        const feed = (await response.json()) as BeholdFeed;
        const posts = [...(feed.posts ?? [])]
          .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
          .slice(0, MAX_POSTS);

        for (const post of posts) {
          const id = String(post.id).replace(/[^a-zA-Z0-9_-]/g, '');
          if (!id) continue;
          const imageUrl = post.sizes?.medium?.mediaUrl ?? post.sizes?.large?.mediaUrl ?? post.thumbnailUrl ?? post.mediaUrl;
          if (!imageUrl) continue;

          const imgRes = await fetch(imageUrl);
          if (!imgRes.ok) throw new Error(`${imageUrl} answered HTTP ${imgRes.status}`);
          const webp = await sharp(Buffer.from(await imgRes.arrayBuffer()))
            .rotate()
            .resize(640, 640, { fit: 'cover', position: 'attention' })
            .webp({ quality: 82 })
            .toBuffer();

          const rawCaption = post.prunedCaption ?? post.caption ?? '';
          const caption = rawCaption.replace(/\s*\n+\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();

          entries.push([
            id,
            {
              permalink: post.permalink,
              timestamp: new Date(post.timestamp),
              mediaType: post.mediaType,
              caption,
              imageBase64: webp.toString('base64'),
            },
          ]);
        }
      } catch (error) {
        if (process.env.CI) throw error;
        logger.warn(`Instagram feed unavailable, keeping the posts loaded previously. ${error}`);
        return;
      }

      store.clear();
      for (const [id, post] of entries) {
        const data = await parseData({ id, data: { ...post } });
        store.set({ id, data, digest: generateDigest(data) });
      }
      meta.set('fetchedAt', String(Date.now()));
      logger.info(`Loaded ${entries.length} Instagram posts.`);
    },
  };
}
