// Site-wide "animations on/off" preference, shared by the hero logo and the footer palms.
// Off by default when the visitor's system asks for reduced motion. Stored per browser.

const STORAGE_KEY = 'ziggles:animations';
const EVENT = 'ziggles:animations-change';

function readStored(): 'on' | 'off' | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'on' || value === 'off' ? value : null;
  } catch {
    return null;
  }
}

export function animationsEnabled(): boolean {
  const stored = readStored();
  if (stored) return stored === 'on';
  return !matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function setAnimationsEnabled(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // Private mode or blocked storage: the choice lasts for this page only.
  }
  document.dispatchEvent(new CustomEvent(EVENT, { detail: enabled }));
}

export function onAnimationsChange(callback: (enabled: boolean) => void) {
  document.addEventListener(EVENT, (event) => callback((event as CustomEvent<boolean>).detail));
}

/** Calls `onVisibleChange` when the element enters or leaves the viewport. */
export function watchVisibility(element: Element, onVisibleChange: (visible: boolean) => void) {
  const observer = new IntersectionObserver(([entry]) => onVisibleChange(entry.isIntersecting), { rootMargin: '100px' });
  observer.observe(element);
}
