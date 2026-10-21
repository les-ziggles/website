// Landing page badge animation (markup: src/assets/brand/ziggles-logo-animated.svg).
//
// Waves: each wave outline is redrawn every frame as a sum of Gerstner (trochoidal) swells, so crests
// sharpen and lean forward like real sea; long waves travel faster than short ones.
// Frisbee: flies along #logo-flight from the trail's tip to its place, growing as it comes closer,
// while the comic motion trail is revealed behind it through #logo-trail-mask.

import { animationsEnabled, watchVisibility } from './motion';
import { animationLoop, bounds, buildPath, parsePath, type Segment } from './svg-path';

const TAU = Math.PI * 2;

// ---------- waves ----------

const BASE_PERIOD = 4.2; // seconds, main swell
const WAVE_SPEED = 1.25; // overall tempo of the sea (1 = calm swell)
const BASE_LENGTH = 300; // viewBox units, main swell
const SWELLS = [
  // length, amplitude, steepness (horizontal orbit), direction, phase
  { length: 300, amplitude: 3.4, steepness: 0.9, direction: 1, phase: 0 },
  { length: 170, amplitude: 1.7, steepness: 0.8, direction: 1, phase: 1.9 },
  { length: 105, amplitude: 0.9, steepness: 0.6, direction: -1, phase: 4.1 },
  { length: 62, amplitude: 0.45, steepness: 0.4, direction: 1, phase: 2.7 },
].map((swell) => {
  const k = TAU / swell.length;
  // Deep-water dispersion: angular speed grows with the square root of the wave number.
  return { ...swell, k, omega: (TAU / BASE_PERIOD) * Math.sqrt(k / (TAU / BASE_LENGTH)) };
});

interface Wave {
  element: SVGPathElement;
  segments: Segment[];
  box: ReturnType<typeof bounds>;
  amplitude: number;
  speed: number;
  phase: number;
  lean: number;
  bob: number;
  drift: number;
}

function prepareWave(element: SVGPathElement, index: number): Wave {
  const segments = parsePath(element.getAttribute('d') ?? '');
  const box = bounds(segments);
  // Lower on the badge = closer to the viewer = larger, quicker motion.
  const depth = Math.min(1, Math.max(0, (box.y + box.height / 2 - 820) / 60));
  return {
    element,
    segments,
    box,
    amplitude: 0.65 + 0.55 * depth,
    speed: 0.85 + 0.25 * depth,
    phase: index * 1.37,
    lean: 3 + 3 * depth,
    bob: 1.4 + 1.2 * depth,
    drift: 2 + 2.5 * depth,
  };
}

function drawWave(wave: Wave, t: number) {
  const envelope = 0.82 + 0.18 * Math.sin(t * 0.11 + wave.phase) * Math.sin(t * 0.07 + 1);
  const bob = wave.bob * Math.sin(t * 0.55 * wave.speed + wave.phase);
  const drift = wave.drift * Math.sin(t * 0.33 * wave.speed + wave.phase * 0.7);
  const bottom = wave.box.y + wave.box.height;

  wave.element.setAttribute(
    'd',
    buildPath(wave.segments, (x, y) => {
      let dx = 0;
      let dy = 0;
      let crest = 0;
      for (const [i, s] of SWELLS.entries()) {
        const theta = s.direction * s.k * x - s.omega * t * wave.speed + s.phase + wave.phase;
        const cos = Math.cos(theta);
        dy -= s.amplitude * cos;
        dx -= s.direction * s.steepness * s.amplitude * Math.sin(theta);
        if (i === 0) crest = cos;
      }
      const scale = wave.amplitude * envelope;
      // Crest tips surge forward as the swell lifts them.
      const height = (bottom - y) / wave.box.height;
      return [x + dx * scale + wave.lean * envelope * height * height * Math.max(0, crest) + drift, y + dy * scale + bob];
    }),
  );
}

// ---------- frisbee throw ----------

const THROW = { hold: 0.6, fadeOut: 0.3, wait: 0.2, fly: 1.6, settle: 0.55 };
const THROW_START = THROW.hold + THROW.fadeOut + THROW.wait;
const THROW_END = THROW_START + THROW.fly + THROW.settle;
const START_SCALE = 0.38;
const TRAIL_LAG = 80; // viewBox units between the disc centre and the trail's leading edge

function createThrow(svg: SVGSVGElement) {
  const flight = svg.querySelector<SVGPathElement>('#logo-flight')!;
  const frisbee = svg.querySelector<SVGGElement>('#logo-frisbee')!;
  const hole = svg.querySelector<SVGPathElement>('#logo-frisbee-hole')!;
  const trail = [...svg.querySelectorAll<SVGPathElement>('.logo-trail')];
  const length = flight.getTotalLength();
  const rest = flight.getPointAtLength(length);

  const setMasked = (masked: boolean) =>
    trail.forEach((el) => (masked ? el.setAttribute('mask', 'url(#logo-trail-mask)') : el.removeAttribute('mask')));
  const setOpacity = (elements: Element[], value: number) =>
    elements.forEach((el) => ((el as SVGElement).style.opacity = value === 1 ? '' : String(value)));

  function place(along: number, scale: number, rotation: number) {
    if (along >= length && scale === 1 && rotation === 0) {
      frisbee.removeAttribute('transform');
      hole.removeAttribute('transform');
      return;
    }
    const p = flight.getPointAtLength(along);
    const transform = `translate(${p.x} ${p.y}) rotate(${rotation}) scale(${scale}) translate(${-rest.x} ${-rest.y})`;
    frisbee.setAttribute('transform', transform);
    hole.setAttribute('transform', transform);
  }

  /** Draws the throw `t` seconds after it started. Returns false once the badge is back in its pose. */
  function draw(t: number): boolean {
    if (t < THROW.hold) return true;
    if (t < THROW.hold + THROW.fadeOut) {
      const alpha = 1 - (t - THROW.hold) / THROW.fadeOut;
      setOpacity([frisbee, ...trail], alpha);
      return true;
    }
    if (t < THROW_START) {
      setOpacity([frisbee], 0);
      setOpacity(trail, 1);
      setMasked(true);
      flight.setAttribute('stroke-dasharray', `0 ${length * 2}`);
      place(0, START_SCALE, 0);
      return true;
    }
    if (t < THROW_START + THROW.fly) {
      const u = (t - THROW_START) / THROW.fly;
      const progress = 1 - Math.pow(1 - u, 1.9); // released fast, slowing on arrival
      const along = progress * length;
      const scale = START_SCALE + (1 - START_SCALE) * Math.pow(progress, 1.4);
      setOpacity([frisbee], Math.min(1, u / 0.08));
      place(along, scale, 9 * (1 - progress) * Math.sin(u * TAU * 2.6));
      flight.setAttribute('stroke-dasharray', `${Math.max(0, along - TRAIL_LAG * scale)} ${length * 2}`);
      return true;
    }
    if (t < THROW_END) {
      // Catch "thunk": a small size/tilt overshoot settling back to the badge pose.
      const s = (t - THROW_START - THROW.fly) / THROW.settle;
      const k = Math.sin(s * TAU) * Math.exp(-3 * s) * (1 - s);
      place(length, 1 + 0.07 * k, -4 * k);
      flight.setAttribute('stroke-dasharray', `${length - TRAIL_LAG * Math.pow(1 - s, 3)} ${length * 2}`);
      return true;
    }
    finish();
    return false;
  }

  /** Puts the badge back exactly as drawn. */
  function finish() {
    setMasked(false);
    setOpacity([frisbee, ...trail], 1);
    place(length, 1, 0);
  }

  return { draw, finish };
}

// ---------- wiring ----------

export function animateLogo(svg: SVGSVGElement) {
  if (!animationsEnabled()) return; // reduced motion: keep the badge still

  const waves = [...svg.querySelectorAll<SVGPathElement>('#logo-waves path')].map(prepareWave);
  const frisbeeThrow = createThrow(svg);
  let visible = true;
  // The throw plays once on arrival; the waves keep moving.
  let throwStartedAt: number | null = 0;

  const loop = animationLoop(
    (time) => {
      waves.forEach((wave) => drawWave(wave, time * WAVE_SPEED));
      if (throwStartedAt !== null && !frisbeeThrow.draw(time - throwStartedAt)) throwStartedAt = null;
    },
    () => visible,
  );

  watchVisibility(svg, (isVisible) => {
    visible = isVisible;
    loop.start();
  });
  loop.start();
}
