#!/usr/bin/env node
// Regenerates the brand SVGs in src/assets/brand/ from the master artwork in design/.
//
//   node scripts/build-brand-assets.mjs
//
// Outputs:
//   ziggles-logo.svg           full badge, cleaned (static use: Open Graph image, print, etc.)
//   ziggles-logo-animated.svg  full badge prepared for the landing animation (waves, frisbee flight)
//   ziggles-eagle-head.svg     eagle head alone with its navy backing (favicons, compact header mark)
//   ziggles-palm-tree.svg      palm tree silhouette (footer)
//
// Every inline `style="..."` is turned into SVG presentation attributes so the markup can be
// inlined in pages served with a strict Content Security Policy (no inline style attributes).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFileSync(root + path, 'utf8');
const write = (path, svg) => {
  writeFileSync(root + path, svg);
  console.log(`wrote ${path} (${(svg.length / 1024).toFixed(1)} kB)`);
};

const NAVY = '#040c36';

// ---------- generic SVG helpers ----------

const PATH_RE = /<path\b[\s\S]*?\/>/g;
const attr = (el, name) => el.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const idOf = (el) => attr(el, 'id');

/** Strips editor metadata and turns style declarations into presentation attributes. */
function cleanMarkup(svg) {
  svg = svg
    .replace(/<\?xml[^>]*\?>\s*/, '')
    .replace(/<metadata[\s\S]*?<\/metadata>\s*/g, '')
    // The master carries two unused gradient definitions left over from the editor.
    .replace(/<defs\b[^>]*>\s*<linearGradient[\s\S]*?<\/linearGradient>\s*<\/defs>\s*/g, '')
    .replace(/\s+xmlns:(svg|c2pa|inkscape|sodipodi)="[^"]*"/g, '')
    .replace(/\s+aria-label="[^"]*"/g, '');
  return svg.replace(/<(path|g|polygon|rect)\b([\s\S]*?)(\/?)>/g, (_, tag, attrs, selfClosing) => {
    const style = attrs.match(/\sstyle="([^"]*)"/)?.[1];
    if (style) {
      attrs = attrs.replace(/\sstyle="[^"]*"/, '');
      for (const decl of style.split(';')) {
        const [prop, value] = decl.split(':').map((s) => s?.trim());
        if (!prop || !value) continue;
        if (!['fill', 'fill-opacity', 'stroke', 'stroke-width', 'opacity', 'display'].includes(prop)) continue;
        if (prop === 'display' && value === 'inline') continue;
        if (prop === 'fill-opacity' && value === '1') continue;
        attrs = attrs.replace(new RegExp(`\\s${prop}="[^"]*"`), '') + ` ${prop}="${value}"`;
      }
    }
    attrs = attrs.replace(/\s+/g, ' ').replace(/\s$/, '');
    return `<${tag}${attrs}${selfClosing}>`;
  });
}

/** Drops editor-generated ids (path123, g8, ...) and tidies whitespace left inside tags. */
const dropEditorIds = (svg) =>
  svg
    .replace(/\sid="(path|g|text|defs|stop|svg)\d[\w-]*"/g, '')
    .replace(/<([a-zA-Z]+)\b([^<>]*?)\s*(\/?)>/g, (_, tag, attrs, close) => `<${tag}${attrs.replace(/\s+/g, ' ')}${close ? ' /' : ''}>`)
    .replace(/\n\s*\n/g, '\n');

function getPath(svg, id) {
  const el = svg.match(PATH_RE)?.find((p) => idOf(p) === id);
  if (!el) throw new Error(`path #${id} not found`);
  return el;
}

const svgDocument = (viewBox, body, title) => {
  const [, , width, height] = viewBox.split(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">
  <title>${title}</title>
${body}
</svg>
`;
};

// ---------- master artwork ----------

const master = read('design/ziggles-logo-master.svg');

// Shapes of the eagle (bird) in paint order, the frisbee and its comic motion trail.
const EAGLE_IDS = ['path324', 'path382', 'path384', 'path386', 'path388', 'path480', 'path3415', 'path490', 'path492', 'path494', 'path5093'];
const FRISBEE_IDS = ['path350', 'path356', 'path358', 'path360', 'path362', 'path364'];
const TRAIL_IDS = ['path556', 'path461', 'path552', 'path554', 'path550', 'path435'];

// ---------- 1. static logo ----------

write('src/assets/brand/ziggles-logo.svg', dropEditorIds(cleanMarkup(master)).replace(/<svg\b[^>]*>/, (open) =>
  open.replace(/\s(id|version)="[^"]*"/g, '') + '\n  <title>Les Ziggles – Ultimate &amp; Disc Golf Antibes</title>'));

// ---------- 2. animation-ready logo ----------
// - path350 holds the frisbee rim AND the gold tail of the trail: split them.
// - the frisbee shapes are grouped (#logo-frisbee) so they can fly along the trail.
// - the bird's dark-red shading (path324) is lifted above the frisbee so the disc passes behind the bird.
// - the trail pieces get class "logo-trail"; a mask (#logo-trail-mask) reveals them along #logo-flight.
// - the waves group becomes #logo-waves; its smallest wave (path526, far right) is redrawn with a crest
//   like the others instead of the flat streak of the master.

// Smallest wave (path526), redrawn as a small peaked wave.
const SMALL_WAVE = 'M 602.257,853.293 C 615,851.2 630,846.4 642.4,842.3 C 643.4,842 644.4,842.1 645.2,842.6 C 652,847 661,858.6 674.6,863.1 L 672.4,864.1 C 663,860.8 654,854.4 645,850.2 C 633,854.6 618,856 602.257,853.293 Z';

// Centerline of the motion trail, from its thin tip (top-left) to the frisbee's resting center.
const FLIGHT = 'M 232,508 C 180,535 135,575 132,625 C 130,670 185,705 245,722 C 300,738 360,757 440,760 C 520,762 600,700 657,606';

function buildAnimatedLogo(source) {
  let svg = source.replace(/<\?xml[^>]*\?>\s*/, '').replace(/<metadata[\s\S]*?<\/metadata>\s*/g, '');

  const rimTail = getPath(svg, 'path350');
  const d = attr(rimTail, 'd');
  const [, rimD, tdx, tdy, tailRest] = d.match(/^(.*?z)\s+m\s+([-\d.]+),([-\d.]+)(.*)$/s);
  const [sx, sy] = d.match(/^m\s+([-\d.]+),([-\d.]+)/).slice(1).map(Number);
  const tailD = `M ${(sx + +tdx).toFixed(5)},${(sy + +tdy).toFixed(5)}${tailRest}`;
  const tail = `<path class="logo-trail" fill="#cea453" d="${tailD}" />`;

  const frisbee = FRISBEE_IDS.map((id) => (id === 'path350' ? rimTail.replace(d, rimD) : getPath(svg, id)));
  for (const id of FRISBEE_IDS.slice(1)) svg = svg.replace(getPath(svg, id), '');
  const shading = getPath(svg, 'path324');
  svg = svg.replace(shading, '');
  svg = svg.replace(rimTail, `${tail}\n<g id="logo-frisbee">\n${frisbee.join('\n')}\n</g>\n${shading}`);

  for (const id of TRAIL_IDS) svg = svg.replace(getPath(svg, id), (el) => el.replace('<path', '<path class="logo-trail"'));
  svg = svg.replace(/<g\b([^>]*?)id="g1"/, '<g$1id="logo-waves"');
  const smallWave = getPath(svg, 'path526');
  svg = svg.replace(smallWave, smallWave.replace(attr(smallWave, 'd'), SMALL_WAVE));

  // Reveal mask: a wide stroke along the flight line, minus a frisbee-shaped hole that follows the disc,
  // so the trail is drawn behind the frisbee and never painted over it.
  const defs = `<defs>
  <mask id="logo-trail-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="896" height="1200">
    <path id="logo-flight" d="${FLIGHT}" fill="none" stroke="#fff" stroke-width="110" stroke-linecap="butt" />
    <path id="logo-frisbee-hole" d="${rimD}" fill="#000" stroke="#000" stroke-width="4" />
  </mask>
</defs>`;
  svg = svg.replace(/<\/svg>\s*$/, `${defs}\n</svg>\n`);

  svg = dropEditorIds(cleanMarkup(svg));
  // The page provides the accessible name; the root keeps only geometry.
  return svg.replace(/<svg\b[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 896 1200">');
}

write('src/assets/brand/ziggles-logo-animated.svg', buildAnimatedLogo(master));

// ---------- 3. eagle head ----------
// In the badge, the eagle's face (eye mask, pupils, gaps between feathers) is the navy shield showing
// through. A navy backing is rebuilt: every bird shape thickened by a thin rounded outline, plus a face plate.

const FACE_PLATE = '352,572 447,588 528,590 530,618 518,636 507,658 462,672 447,738 432,746 372,668 352,650';
{
  const shapes = EAGLE_IDS.map((id) => cleanMarkup(getPath(master, id)).replace(/\s+/g, ' '));
  const backing = shapes.map((el) => `    <path d="${attr(el, 'd')}" />`).join('\n');
  const body = `  <g fill="${NAVY}" stroke="${NAVY}" stroke-width="8" stroke-linejoin="round">
    <polygon points="${FACE_PLATE}" />
${backing}
  </g>
  <g>
${shapes.map((el) => '    ' + el.replace(/\sid="[^"]*"/, '')).join('\n')}
  </g>`;
  write('src/assets/brand/ziggles-eagle-head.svg', svgDocument('215 478 362 347', body, 'Les Ziggles'));
}

// ---------- 4. palm tree ----------
// The master tree stands on a small island. The island is cut off and the trunk carried down to the
// bottom of the box (y 832) with a slightly flared foot, so the footer can cast the tree's shadow instead.

// Outline section from the trunk's left foot (689.13, 814.04) around the island to its right foot (704.99, 814.75).
const PALM_ISLAND = /(-12\.55664,25\.52539 )[^z]*?( 11\.77098,-34\.42794)/;
const PALM_TRUNK_FOOT = 'C 687.98,817.04 686.6,821.5 685,825.6 C 684,828 682.4,830.2 681.2,832 L 701.2,832 C 700.5,829.8 700.3,827.3 700.8,824.6 C 701.1,823 703.81,818.19 704.98631,814.74802 c';
{
  const palm = read('design/ziggles-palm-tree-master.svg');
  const master = attr(palm.match(PATH_RE)[0], 'd');
  if (!PALM_ISLAND.test(master)) throw new Error('palm island not found');
  const d = master.replace(PALM_ISLAND, `$1${PALM_TRUNK_FOOT}$2`);
  write('src/assets/brand/ziggles-palm-tree.svg', svgDocument('649 678 123 154', `  <path fill="#ffffff" d="${d}" />`, 'Palmier'));
}
