# Libraries instead of hand-written code

Use the repo's installed library for the need. If none is installed, propose the canonical one
below with an exact version and ask before installing. Never hand-write the column on the right.

## TypeScript and JavaScript

| Need                                                      | Use                                              | Never hand-write                                          |
| --------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------- |
| Arrays, objects, debounce, throttle, groupBy, deep equal  | es-toolkit                                       | a growing `utils.ts`                                      |
| Dates, durations, formatting, relative time               | date-fns (+ `@date-fns/tz` for time zones)       | millisecond arithmetic, manual "3 days ago"               |
| Time zones                                                | `@date-fns/tz`, `Intl.DateTimeFormat`            | offset tables                                             |
| IDs                                                       | ulid, nanoid, `crypto.randomUUID()`              | `Math.random` IDs, custom encoders                        |
| Validation, parsing, coercion                             | zod                                              | type guards, `if` ladders                                 |
| Errors as values                                          | neverthrow                                       | custom `Result` types                                     |
| Matching on cases and shapes                              | ts-pattern                                       | nested switch/if pyramids                                 |
| HTTP requests                                             | ofetch                                           | fetch wrappers with retry and timeout                     |
| Environment variables                                     | `@t3-oss/env-core` with zod (one env package)    | `process.env.X` reads scattered around                    |
| Format, lint, type check, hooks                           | Vite+ (`vp fmt`, `vp lint`, `vp check`, `vp staged`) | ESLint, Prettier, Husky, lefthook, custom scripts    |
| Database access and types                                 | drizzle-orm, `drizzle-orm/zod`                   | SQL strings with hand-written row types                   |
| Auth, sessions, passkeys, 2FA, SSO                        | better-auth and its plugins                      | session tables, token logic                               |
| Encryption of secrets                                     | the cloud's Encryption SDK / platform `crypto`   | any custom crypto                                         |
| Hashing passwords                                         | the auth library's hashing                       | custom salts and loops                                    |
| Rate limiting                                             | the platform's or the framework's limiter        | in-memory counters                                        |
| Cron parsing, scheduling                                  | the platform scheduler                           | interval loops                                            |
| Markdown                                                  | a maintained parser (remark/marked)              | regex rendering                                           |
| CSV                                                       | a maintained parser                              | `split(',')`                                              |
| PDF                                                       | pdf-lib (and fontkit)                            | drawing primitives by hand                                |
| Email templates                                           | react-email                                      | HTML strings                                              |
| OpenTelemetry                                             | `@opentelemetry/api`                             | custom tracing objects                                    |
| Testing                                                   | `vp test` (Vitest in Vite+), Playwright          | a home-made test harness                                  |

## React

| Need                                    | Use                                             | Never hand-write                                   |
| --------------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| Server state, caching, refetch          | TanStack Query                                  | `useEffect` + `useState` fetching, custom caches   |
| Forms                                   | react-hook-form + zod resolver                  | controlled-input state machines                    |
| Common hooks (storage, media, debounce) | usehooks-ts                                     | `useLocalStorage`, `useMediaQuery` again           |
| Routing and URL state                   | the router (TanStack Router) and its search params | manual `URLSearchParams` syncing                |
| UI primitives                           | shadcn/ui on Radix, the repo's components       | dropdowns, dialogs, tooltips, popovers, focus traps |
| Styling                                 | Tailwind and the design tokens                  | inline style objects, new CSS files                |
| Animation                               | motion                                          | `requestAnimationFrame` loops                      |
| Icons                                   | the repo's icon package and wrapper             | inline SVGs copied from the web                    |
| Tables, virtualised lists               | TanStack Table, TanStack Virtual                | manual sorting, windowing                          |
| Toasts                                  | the repo's toast component (sonner)             | custom toast stacks                                |

## Before adding a library

1. Check the repo does not already have one for the need.
2. Prefer the library the ecosystem standardised on (most used, maintained, typed).
3. Pin the exact version, add it only to the package that needs it, and ask the user.
4. Use it the way its docs show. Do not wrap it to rename it.
