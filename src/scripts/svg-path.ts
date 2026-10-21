// Minimal SVG path toolkit for shape animations: parse a path into absolute segments once,
// then rebuild it every frame with each point moved by a displacement function.

export interface Segment {
  command: 'M' | 'L' | 'C' | 'Z';
  points: number[];
}

/** Parses path data using M, L, H, V, C and Z commands (absolute or relative). */
export function parsePath(d: string): Segment[] {
  const tokens = d.match(/[MmLlHhVvCcZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  const segments: Segment[] = [];
  let i = 0;
  let command = '';
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  const next = () => parseFloat(tokens[i++]);

  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) command = tokens[i++];
    const relative = command === command.toLowerCase();
    switch (command.toUpperCase()) {
      case 'M':
        x = startX = next() + (relative ? x : 0);
        y = startY = next() + (relative ? y : 0);
        segments.push({ command: 'M', points: [x, y] });
        command = relative ? 'l' : 'L'; // further pairs are implicit line-tos
        break;
      case 'L':
        x = next() + (relative ? x : 0);
        y = next() + (relative ? y : 0);
        segments.push({ command: 'L', points: [x, y] });
        break;
      case 'H':
        x = next() + (relative ? x : 0);
        segments.push({ command: 'L', points: [x, y] });
        break;
      case 'V':
        y = next() + (relative ? y : 0);
        segments.push({ command: 'L', points: [x, y] });
        break;
      case 'C': {
        const points: number[] = [];
        for (let k = 0; k < 3; k++) points.push(next() + (relative ? x : 0), next() + (relative ? y : 0));
        [x, y] = points.slice(4);
        segments.push({ command: 'C', points });
        break;
      }
      case 'Z':
        x = startX;
        y = startY;
        segments.push({ command: 'Z', points: [] });
        break;
      default:
        throw new Error(`Unsupported path command "${command}"`);
    }
  }
  return segments;
}

/** Serialises segments, moving every point (anchors and control points) through `displace`. */
export function buildPath(segments: Segment[], displace: (x: number, y: number) => [number, number]): string {
  let d = '';
  for (const { command, points } of segments) {
    d += command;
    for (let k = 0; k < points.length; k += 2) {
      const [px, py] = displace(points[k], points[k + 1]);
      d += `${k ? ' ' : ''}${px.toFixed(2)} ${py.toFixed(2)}`;
    }
  }
  return d;
}

/** Bounding box of the anchor and control points. */
export function bounds(segments: Segment[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { points } of segments) {
    for (let k = 0; k < points.length; k += 2) {
      minX = Math.min(minX, points[k]);
      maxX = Math.max(maxX, points[k]);
      minY = Math.min(minY, points[k + 1]);
      maxY = Math.max(maxY, points[k + 1]);
    }
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** requestAnimationFrame loop with a clock that only advances while `isRunning()` is true. */
export function animationLoop(frame: (time: number, delta: number) => void, isRunning: () => boolean) {
  let last = performance.now();
  let time = 0;
  let handle = 0;
  const tick = (now: number) => {
    const delta = Math.min(0.1, (now - last) / 1000);
    last = now;
    time += delta;
    frame(time, delta);
    handle = isRunning() ? requestAnimationFrame(tick) : 0;
  };
  return {
    /** (Re)starts the loop if it is not running. */
    start() {
      if (handle || !isRunning()) return;
      last = performance.now();
      handle = requestAnimationFrame(tick);
    },
  };
}
