// /news/instagram/<id>.webp – locally re-hosted thumbnails of the latest @ziggles06 Instagram posts.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';

export const getStaticPaths = (async () => {
  const posts = await getCollection('instagram');
  return posts.map((post) => ({
    params: { id: post.id },
    props: { imageBase64: post.data.imageBase64 },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const bytes = Buffer.from((props as { imageBase64: string }).imageBase64, 'base64');
  return new Response(new Uint8Array(bytes), {
    headers: { 'Content-Type': 'image/webp' },
  });
};
