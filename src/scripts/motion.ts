// Motion helpers shared by the hero logo and the footer palms.

/** Animations run unless the visitor's system asks for reduced motion. */
export const animationsEnabled = (): boolean => !matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Calls `onVisibleChange` when the element enters or leaves the viewport. */
export function watchVisibility(element: Element, onVisibleChange: (visible: boolean) => void) {
  const observer = new IntersectionObserver(([entry]) => onVisibleChange(entry.isIntersecting), { rootMargin: '100px' });
  observer.observe(element);
}
