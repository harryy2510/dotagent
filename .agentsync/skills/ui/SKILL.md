---
name: ui
description: "Use when setting up or changing UI foundations in React: Tailwind CSS v4 and design tokens (OKLCH, semantic tokens), dark mode, cn(), component variants with CVA, React 19 component patterns, layout and responsive rules, motion with reduced-motion support, icons, toasts, design quality, accessibility (WCAG 2.2 AA), and reviews against the Web Interface Guidelines. For adding or composing shadcn components, also load the shadcn skill."
---

# UI foundations: Tailwind v4, tokens, React 19

Styling is Tailwind and design tokens only: no inline style objects, no CSS modules, no new CSS
files beyond the one global stylesheet. If the repo has a design system document or boards, they
decide colours, type, spacing and copy; this skill only says how to build them.

## Tailwind v4

```css
/* src/styles.css: the only stylesheet */
@import 'tailwindcss';
@plugin '@tailwindcss/typography';
@custom-variant dark (&:where(.dark, .dark *));

:root {
	--background: oklch(1 0 0);
	--foreground: oklch(0.145 0 0);
	--primary: oklch(0.205 0.006 286);
	--primary-foreground: oklch(0.985 0 0);
	--muted: oklch(0.97 0 0);
	--muted-foreground: oklch(0.556 0 0);
	--border: oklch(0.922 0 0);
	--ring: oklch(0.708 0 0);
	--destructive: oklch(0.577 0.245 27.3);
	--radius: 0.625rem;
}

.dark {
	--background: oklch(0.145 0 0);
	--foreground: oklch(0.985 0 0);
	/* ...every token redefined */
}

@theme inline {
	--color-background: var(--background);
	--color-foreground: var(--foreground);
	--color-primary: var(--primary);
	/* ...map each token so bg-primary, text-muted-foreground work */
}
```

| Tailwind v3                         | v4                                    |
| ----------------------------------- | ------------------------------------- |
| `tailwind.config.ts`                | `@theme` in CSS                       |
| `@tailwind base/components/utilities` | `@import 'tailwindcss'`             |
| `darkMode: 'class'`                 | `@custom-variant dark (...)`          |
| `theme.extend.colors`               | CSS variables + `@theme inline`       |

## Tokens

- Three layers: brand values (raw OKLCH) → semantic tokens (`--primary`, `--muted`,
  `--destructive`) → utilities (`bg-primary`). Components use semantic utilities only.
- Never raw palette classes (`bg-blue-500`) or hex values in components; never `dark:` overrides
  on components (tokens switch with the theme).
- Every token exists in light and dark; check contrast in both (4.5:1 body text, 3:1 large text
  and UI parts).

## cn() and variants

```ts
// src/lib/cn.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
```

```ts
import { cva, type VariantProps } from 'class-variance-authority'

export const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 text-xs font-medium', {
	variants: {
		tone: { neutral: 'bg-muted text-muted-foreground', ok: 'bg-ok/10 text-ok', bad: 'bg-destructive/10 text-destructive' }
	},
	defaultVariants: { tone: 'neutral' }
})
export type BadgeProps = VariantProps<typeof badgeVariants>
```

- Variant props types derive from `cva` (`VariantProps`); never hand-written unions.
- Variants live in a `.variants.ts` module when a React file would otherwise export non-component
  values (Fast Refresh, see `tanstack-start-cloudflare`).

## React 19 components

```tsx
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: ComponentProps<'div'>) {
	return <div className={cn('rounded-lg border bg-card text-card-foreground', className)} {...props} />
}
```

- `ref` is a normal prop in React 19: no `forwardRef`. Props derive from `ComponentProps<'tag'>`
  or the wrapped component's props.
- Named imports from `react`; never `import React`.
- One component per file for exported components; small private pieces may share the file.
- Compose existing components before writing new ones (`shadcn` skill).

## Layout

- Flex and grid with `gap-*`; never `space-x-*`/`space-y-*` or margins between siblings.
- Mobile first: design at 390 px width, then add `sm:`/`md:`/`lg:`; no horizontal scroll at any
  width.
- `size-*` when width equals height; `truncate`/`line-clamp-*` for overflow.
- Container widths and spacing from the design system, not one-off values.

## Dark mode

Class on `<html>` set before paint (see `zustand-x-ui-state` for the no-flash theme pattern);
tokens do the rest.

## Motion

- `motion/react` for component animation; CSS transitions are fine for simple hover and focus
  states.
- Motion explains a change (enter, exit, reorder, progress); it never decorates or loops.
- Respect reduced motion everywhere: `useReducedMotion()` or the `motion-safe:`/`motion-reduce:`
  variants; nothing moves for those users except essential progress indicators.

## Icons

- One icon source per repo, through one shared wrapper if the source needs one (for example an
  animated icon set driven by the parent control's hover and focus). Default for new repos:
  `lucide-react`.
- Same meaning, same icon, everywhere; keep a meaning-to-icon map when the repo has many icons.
- Icons with meaning get an accessible name; decorative icons are `aria-hidden`.

## Feedback

- Toasts with `sonner` (one `<Toaster />` in the root); toasts confirm actions, never carry errors
  the user must act on (show those inline).
- Every async view has loading (skeletons that match the layout), empty (what to do next) and
  error (what happened, how to recover) states.

## Accessibility (WCAG 2.2 AA)

See `references/accessibility-checklist.md`. Minimum on every change: keyboard reachable, visible
focus, labels, contrast in both themes, no information by colour alone, reduced motion, target
size at least 24×24 px.

## Design quality

When the repo has no design system, decide one deliberately and write it down: a type pair, a
colour system with one accent, a spacing scale, radius, and motion rules. Avoid default-looking
output (generic fonts, purple gradients, everything in identical rounded cards). Spend boldness in
one place per screen.

## Reviewing against the Web Interface Guidelines

When asked to review UI files:

1. Fetch the current guidelines:
   `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`.
2. Read the files (ask which ones if none are given).
3. Report findings in the guidelines' `file:line` format.
