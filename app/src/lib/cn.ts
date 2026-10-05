import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Joins class names and resolves Tailwind conflicts so that the LAST one wins:
 *   cn('w-full px-3', 'w-40')  →  'px-3 w-40'
 * This is what makes `className` overrides on the shared components reliable.
 * Skips false / null / undefined.
 */
export type ClassValue = string | false | null | undefined;

const merge = extendTailwindMerge({
  extend: {
    // Our own spacing names from tailwind.config.ts.
    theme: { spacing: ['gutter', 'sidebar', 'topbar'] },
  },
});

export function cn(...parts: ClassValue[]): string {
  let out = '';
  for (const p of parts) {
    if (p) out += (out ? ' ' : '') + p;
  }
  return merge(out);
}
