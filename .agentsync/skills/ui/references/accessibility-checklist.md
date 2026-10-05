# Accessibility checklist (WCAG 2.2 AA)

Use for any UI change. Legal context (ADA, European Accessibility Act, Section 508) is in the
`compliance` skill.

## Semantics

- Native elements before ARIA: `button` for actions, `a` for navigation, `label` for inputs,
  `fieldset`/`legend` for groups, lists for lists, tables for tabular data.
- One `h1` per page; headings in order; landmarks (`header`, `nav`, `main`, `footer`).
- Every input has a programmatic label; helper and error text linked with `aria-describedby`;
  invalid fields have `aria-invalid`.
- Icon-only buttons have an accessible name; decorative images and icons are `aria-hidden` or
  `alt=""`.
- Page `<title>` and `lang` set; route changes announce the new page.

## Keyboard and focus

- Everything interactive works with the keyboard, in visual order.
- Focus is always visible (2.4.7) and not hidden under sticky headers (2.4.11, new in 2.2).
- Dialogs trap focus, close on Escape and return focus to the trigger.
- Menus, comboboxes, tabs, disclosures and listboxes follow the WAI-ARIA patterns (arrow keys,
  Home/End, typeahead where expected) — use the component library's primitives instead of
  building them.
- No keyboard traps; skip link to main content on long pages.

## Visual

- Contrast: 4.5:1 text, 3:1 large text, icons and control boundaries, in light and dark.
- Never colour alone: pair with text, icon or pattern.
- Text resizes to 200% and reflows at 320 px width without horizontal scrolling.
- Target size at least 24×24 px (2.5.8, new in 2.2), 44×44 px for primary touch targets.
- Dragging actions have a non-dragging alternative (2.5.7, new in 2.2).

## Motion and time

- Respect `prefers-reduced-motion`; no auto-playing motion longer than 5 s without a pause.
- No time limits without a way to extend them (session timeouts warn first).

## Forms and auth

- Errors say what went wrong and how to fix it, next to the field and announced.
- Authentication does not require a cognitive test (3.3.8, new in 2.2): allow password managers
  and paste, offer passkeys or email links.
- Do not ask for the same information twice in one flow (3.3.7, new in 2.2).

## Content

- Plain language, consistent names for the same thing, help in the same place across pages
  (3.2.6, new in 2.2).
- Loading, empty and error states are understandable without animation or colour.

## Verification

- Keyboard-only pass through the changed flow.
- Automated scan with axe (`@axe-core/playwright` in end-to-end tests) with no serious or
  critical issues.
- Screen reader spot check (VoiceOver or NVDA) for custom controls.
