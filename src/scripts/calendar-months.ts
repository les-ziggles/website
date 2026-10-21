// Month by month browsing of the club calendar (markup: src/components/content/ClubCalendar.astro).
// The page lists every month; this shows one at a time and reveals the previous / next buttons.

export function enhanceCalendarMonths(calendar: HTMLElement) {
  const months = [...calendar.querySelectorAll<HTMLElement>('[data-calendar-month]')];
  const status = calendar.querySelector<HTMLElement>('[data-month-status]');
  if (months.length < 2) return;

  let current = 0;
  const show = (index: number) => {
    current = index;
    months.forEach((month, i) => (month.hidden = i !== index));
  };

  for (const button of calendar.querySelectorAll<HTMLButtonElement>('[data-month-step]')) button.hidden = false;
  show(0);

  calendar.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-month-step]');
    if (!button || button.disabled) return;
    const step = Number(button.dataset.monthStep);
    show(Math.min(months.length - 1, Math.max(0, current + step)));

    // Keep the keyboard on the same button of the month now shown, or on its title at either end.
    const month = months[current];
    const title = month.querySelector<HTMLElement>('h3');
    const sameButton = month.querySelector<HTMLButtonElement>(`[data-month-step="${step}"]`);
    (sameButton && !sameButton.disabled ? sameButton : title)?.focus();
    if (status && title) status.textContent = title.textContent?.trim() ?? '';
  });
}
