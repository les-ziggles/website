#!/usr/bin/env node
// French typography: replaces the plain space before : ; ! ? » and after « with a narrow no-break space
// (U+202F) so the punctuation never wraps alone onto the next line.
//
//   node scripts/french-spacing.mjs src/content/pages/fr/*.mdx src/i18n/ui.ts
//   (or: bun run typography)
//
// Safe to run repeatedly. Only touches spaces directly followed/preceded by that punctuation.
import { readFileSync, writeFileSync } from 'node:fs';

const NNBSP = ' ';
for (const file of process.argv.slice(2)) {
  const text = readFileSync(file, 'utf8');
  const fixed = text
    .replace(/ ([:;!?»])/g, `${NNBSP}$1`)
    .replace(/« /g, `«${NNBSP}`)
    // "50 €", "12 h 15": keep numbers with their unit.
    .replace(/(\d) €/g, `$1${NNBSP}€`)
    .replace(/(\d) h (\d)/g, `$1${NNBSP}h${NNBSP}$2`)
    // Keep JS/MDX syntax intact: object literals and JSX comments use ": " without a leading space.
    .replace(new RegExp(`(\\w)${NNBSP}\\?\\.`, 'g'), '$1 ?.')
    // Nor the nullish coalescing operator: "a ?? b".
    .replace(new RegExp(`${NNBSP}\\?\\?`, 'g'), ' ??');
  if (fixed !== text) {
    writeFileSync(file, fixed);
    console.log(`fixed ${file}`);
  }
}
