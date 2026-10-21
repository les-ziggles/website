// Markdown (Sätteri) plugin: prefixes root-relative links written in page content ("/entrainements/")
// with the base path the site is published under ("/website/entrainements/" on GitHub Pages).
// Content authors keep writing plain site paths as Markdown links: [text](/entrainements/).

import { defineHastPlugin } from 'satteri';
import { withBase } from '../deploy.config';

export const basePathLinks = defineHastPlugin({
  name: 'ziggles-base-path-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      const href = node.properties?.href;
      if (typeof href === 'string' && withBase(href) !== href) ctx.setProperty(node, 'href', withBase(href));
    },
  },
});
