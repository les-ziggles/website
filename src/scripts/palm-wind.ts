// Light sea breeze on the footer palm trees (markup: src/components/brand/PalmGrove.astro).
// The trunk bends more and more towards the top under slow gusts; fronds flutter faster.
// Coordinates are those of src/assets/brand/ziggles-palm-tree.svg.

import { animationsEnabled, onAnimationsChange, watchVisibility } from './motion';
import { animationLoop, bounds, buildPath, parsePath } from './svg-path';

// Measured on the artwork: where the fronds meet, and the foot of the trunk on the island.
const CROWN = { x: 714, y: 737 };
const TRUNK_FOOT = { x: 697, y: 820 };

const trunkXAt = (y: number) => TRUNK_FOOT.x + ((TRUNK_FOOT.y - y) / (TRUNK_FOOT.y - CROWN.y)) * (CROWN.x - TRUNK_FOOT.x);

export function animatePalms(container: Element) {
  const palms = [...container.querySelectorAll<SVGPathElement>('[data-palm]')].map((element, index) => {
    const segments = parsePath(element.getAttribute('d') ?? '');
    const box = bounds(segments);
    return {
      element,
      segments,
      box,
      phase: index * 2.1 + 0.4,
      strength: Number(element.dataset.palmStrength ?? 1),
      wind: Number(element.dataset.palmWind ?? 1), // -1 for mirrored trees
    };
  });

  let enabled = animationsEnabled();
  let visible = false;

  const loop = animationLoop(
    (t) => {
      for (const palm of palms) {
        const bottom = palm.box.y + palm.box.height;
        // Gusts build and fade slowly; the sway rides on top of them.
        const gust = 0.55 + 0.45 * Math.sin(t * 0.37 + palm.phase) * Math.sin(t * 0.21 + palm.phase * 0.5);
        const sway = gust * (0.7 + 0.3 * Math.sin(t * 1.25 + palm.phase));
        palm.element.setAttribute(
          'd',
          buildPath(palm.segments, (x, y) => {
            const height = Math.max(0, (TRUNK_FOOT.y - y) / (TRUNK_FOOT.y - palm.box.y)); // 0 at the trunk foot
            if (y > TRUNK_FOOT.y - 2) return [x, y]; // the island stays put
            const bend = 7 * palm.wind * palm.strength * height * height * sway;
            // Points away from the trunk belong to the fronds: they flutter.
            const frond = Math.min(1, Math.max(0, (Math.abs(x - trunkXAt(y)) - 5) / 28)) * (y < bottom - 25 ? 1 : 0);
            const flutterX = 1.6 * palm.strength * frond * gust * Math.sin(t * 5.2 + x * 0.12 + palm.phase);
            const flutterY = 1.1 * palm.strength * frond * gust * Math.cos(t * 4.3 + x * 0.17 + palm.phase);
            return [x + bend + flutterX, y + Math.abs(bend) * 0.06 + flutterY];
          }),
        );
      }
    },
    () => enabled && visible,
  );

  watchVisibility(container, (isVisible) => {
    visible = isVisible;
    loop.start();
  });
  onAnimationsChange((isEnabled) => {
    enabled = isEnabled;
    loop.start();
  });
}
