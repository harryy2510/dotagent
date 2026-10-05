---
name: forms-rhf-zod
description: "Use when creating or editing forms or input validation: react-hook-form with zodResolver, Zod 4 schemas shared between client and server, default values, edit forms, field arrays, dependent fields, multi-step forms, server errors mapped onto fields, and accessible form markup."
---

# Forms: react-hook-form + Zod 4

Stack: `react-hook-form`, `zod` (v4), `@hookform/resolvers` (v5). One Zod schema per form is the
single source of truth for the client form, the server validation and the types.

## Schemas

```ts
// src/api/contacts/schemas.ts
import { z } from 'zod'

export const contactInput = z.object({
	email: z.email({ error: 'Enter a valid email address.' }),
	name: z.string().trim().min(1, { error: 'Enter a name.' }),
	notes: z.string().trim().max(500).nullable()
})
```

- Import from `zod` (Zod 4). Top-level formats: `z.email()`, `z.url()`, `z.uuid()`; never the
  deprecated `z.string().email()`.
- Errors with `{ error: '...' }`, written for the person filling in the form: what to do, not what
  failed.
- Derive types; never hand-write them: `z.input<typeof s>` for what the form holds,
  `z.output<typeof s>` (= `z.infer`) for what the server receives.
- Database-backed forms derive from the table schema (`drizzle-orm/zod` `createInsertSchema`, or the
  generated database types) and `.pick()`/`.extend()` it; never a parallel shape.
- One "empty" per field, matching the column: nullable columns use `.nullable()` and `null`; never
  `''` in one place and `undefined` in another.
- The same schema validates on the server; the client copy is for user feedback, never trust.

## The form

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { contactInput } from '@/api/contacts/schemas'

type ContactForm = z.input<typeof contactInput>
type Contact = z.output<typeof contactInput>

export function ContactForm({ onSubmit }: { onSubmit: (value: Contact) => Promise<void> }) {
	const form = useForm<ContactForm, unknown, Contact>({
		resolver: zodResolver(contactInput),
		defaultValues: { email: '', name: '', notes: null },
		mode: 'onTouched'
	})
	// render fields with the repo's form components (shadcn Form/Field)
}
```

- `zodResolver(schema)` directly; the three generics (input, context, output) make coerced and
  transformed fields type-correct. No wrapper around the resolver.
- **Default values:** every field gets an explicit default of its input type (`''` for required
  text, `null` for nullable, `[]` for arrays). If the repo uses a defaults helper such as
  `zod-empty`'s `init(schema)`, keep using it consistently.
- **Edit forms:** pass the loaded record through `values` (re-syncs when the data changes) and keep
  `defaultValues` for the shape; or `reset(record)` once after loading. Never copy fields one by
  one.
- `mode: 'onTouched'` for most forms (errors after a field is left), `onSubmit` for short forms.
- Disable the submit button only while submitting (`formState.isSubmitting`); never to hide
  validation.

## Watching values

- `useWatch({ name })` inside the form provider (or `useWatch({ control, name })` outside) for
  render-time reads; it re-renders only that subscriber.
- Never `form.watch()` in render; `watch` with a callback is for side effects outside React
  render.
- Derived values are computed during render from watched values, not stored in state.

## Arrays and dependent fields

- `useFieldArray` with stable `field.id` keys, never the index.
- Dependent validation (end after start, confirm password) lives in the schema with
  `.refine`/`.superRefine` and a `path`, so the server enforces it too.
- Conditional sections: a discriminated union (`z.discriminatedUnion('kind', [...])`) instead of
  optional fields checked by hand.

## Multi-step forms

- One schema per step plus the full schema composed from them (`stepA.merge(stepB)` or
  `z.object({ ...stepA.shape, ...stepB.shape })`).
- Validate the current step with `trigger([...fields])` before moving on.
- Keep all steps in one `useForm` so values survive navigation; persist drafts only if the
  product asks for it (and never sensitive fields).

## Server side

- The handler parses the request once with the same schema (see the `hono` or
  `tanstack-start-cloudflare` skill for the framework call; TanStack Start uses
  `.inputValidator(schema)`).
- Server errors come back as `{ code, message, issues? }`. Map field issues onto the form:

```ts
for (const issue of error.issues ?? []) {
	form.setError(issue.path.join('.') as Path<ContactForm>, { message: issue.message })
}
```

- Non-field errors show once at the top of the form (`root.serverError`) or as a toast, in the
  product's wording.

## Accessibility

- Every input has a visible label (`<label for>` or the form component's label).
- Errors are linked with `aria-describedby` and announced (`aria-invalid` on the input).
- Focus moves to the first invalid field on submit (react-hook-form does this with
  `shouldFocusError`, on by default).
- Required fields are marked in text, not only by colour.

## Never

- A hand-written type next to a schema.
- Validation in `onChange` handlers or `if` checks in submit handlers that the schema could do.
- `reportInput` on schemas that may hold personal data (it can leak values into logs).
- Uncontrolled state machines that re-implement react-hook-form.
