# CLAUDE.md — Stock Screener + AI Thesis Generator

Next.js 15 (App Router) + Supabase + Claude API stock screener with AI-powered investment thesis generation.

## Tech Stack

- **Framework:** Next.js 15 (App Router), React 19
- **Database:** Supabase (Postgres + Auth + RLS)
- **AI:** Anthropic Claude API (`@anthropic-ai/sdk`)
- **State:** TanStack Query (React Query) for all server state
- **Styling:** Tailwind CSS + shadcn/ui + class-variance-authority
- **Validation:** Zod (runtime validation + type inference)
- **Caching:** Upstash Redis (FMP API responses, thesis cache)
- **Charts:** Recharts (sparklines), Lightweight Charts (interactive)
- **Testing:** Vitest + React Testing Library

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run tests (vitest)
npx supabase start   # Start local Supabase
```

## Coding Conventions

### TypeScript
- Strict mode enabled, never use `any`
- Prefer `z.infer<typeof Schema>` over manual interface definitions
- Zod schemas are the single source of truth for types where applicable

### Imports
- Use `@/` path alias for all imports from `src/` (e.g., `import { cn } from '@/lib/utils'`)
- Never use relative imports that traverse up more than one level (no `../../`)
- Import order: 1) React/Next.js, 2) third-party libs, 3) `@/` project imports, 4) relative imports

### Naming
- All files and directories: `kebab-case` (e.g., `filter-builder.tsx`, `use-watchlist.ts`)
- React components: `PascalCase` exports from `kebab-case` files (e.g., `filter-builder.tsx` exports `FilterBuilder`)
- Hooks: `use-` prefix files, `use` prefix exports (e.g., `use-screener.ts` exports `useScreener`)
- Zod schemas: `PascalCase` with `Schema` suffix (e.g., `RunScreenerSchema`)
- Inferred types: Match schema name without `Schema` (e.g., `type RunScreenerInput = z.infer<typeof RunScreenerSchema>`)

### Validation
- All Zod schemas live in `src/lib/validators/{domain}.ts`
- API routes MUST validate input with `.safeParse()` before processing
- Return early on validation failure with 400 status

### API Error Format
All API routes return consistent shapes:
```ts
// Success
{ data: T }
// Error
{ error: { message: string, code?: string, details?: Record<string, string[]> } }
```

### TanStack Query Keys
Hierarchical arrays following this convention:
```ts
['stocks', ticker]                  // Single stock
['stocks', 'search', query]        // Ticker search
['screener', 'presets']            // Preset strategies
['screener', 'configs']            // User saved configs
['screener', 'results', configId]  // Screening results
['thesis', stockId]                // Cached thesis
['watchlist']                      // User watchlist
```

### Redis Cache Keys
```ts
`fmp:${endpoint}:${params}`              // FMP API responses (15-min TTL)
`thesis:${stockId}:${strategyType}:${tone}` // Thesis cache (24h TTL)
`screener:preset:${presetId}`            // Preset results (1h TTL)
```

### Components & Styling
- Use `cn()` from `src/lib/utils.ts` for className merging (clsx + tailwind-merge)
- shadcn/ui base components in `src/components/ui/`
- Feature components in `src/components/{feature}/` (screener, thesis, charts, layout, shared)

### Tests
- Colocate test files next to source: `*.test.ts` / `*.test.tsx`
- Vitest for unit/integration, React Testing Library for components

### Error Handling
- **API routes:** Always return the standard `{ error: { message, code?, details? } }` shape — never throw unstructured errors
- **Error boundaries:** Global `src/app/error.tsx` + per-route `error.tsx` for `/dashboard`, `/screener`, `/stock/[ticker]`
- **Hooks:** Surface TanStack Query `isError`/`error` state — never silently swallow errors
- **Toasts:** Success (watchlist add, config saved), Error (API failures, rate limits), Info (data refresh)
- **Financial data:** Display `"N/A"` for missing metrics, never `0` or blank

### Supabase Clients
- `src/lib/supabase/client.ts` — Client Components, hooks, browser-side auth state
- `src/lib/supabase/server.ts` — API routes (`src/app/api/`), Server Components, middleware, cron jobs
- Never import `server.ts` in client components or vice versa

## File Organization

```
src/app/api/{domain}/{action}/route.ts   — API routes
src/lib/validators/{domain}.ts           — Zod schemas
src/lib/supabase/client.ts               — Browser Supabase client
src/lib/supabase/server.ts               — Server Supabase client
src/lib/fmp/client.ts                    — FMP API client (with Redis cache)
src/lib/claude/client.ts                 — Claude API client
src/lib/claude/prompts.ts                — Prompt templates
src/lib/utils.ts                         — cn() helper, general utils
src/lib/format.ts                        — Number/currency/date formatting
src/types/index.ts                       — Shared TypeScript types
src/types/database.types.ts              — Supabase generated types
src/hooks/                               — Custom React hooks (use-screener, use-watchlist)
src/providers/                           — React context providers (query, toast)
```

## Database Rules

- **Never modify committed migration files** — always create new migrations
- Screener queries go against `latest_stock_snapshot` materialized view, not raw tables
- All tables have RLS enabled — respect user isolation
- Migration files are in `supabase/migrations/` and run in sequence

## Environment Variables

Required in `.env.local`:
```
# Required — app will not start without these
SUPABASE_URL=
SUPABASE_ANON_KEY=
FMP_API_KEY=
ANTHROPIC_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Required in production — cron job auth
CRON_SECRET=
```

## API Rate Limits

- **FMP API:** 250 requests/day (free tier) — all responses cached in Redis (15-min TTL)
- **Claude API:** Budget per user — free: 20 theses/day, pro: 200 theses/day
- **Rate limiting:** Enforced via Upstash Redis in `middleware.ts` (Phase 5)

## Git Conventions

- **Commits:** Conventional Commits format — `type(scope): description` (e.g., `feat(screener): add filter builder component`)
- **Types:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`
- **Branches:** `feature/short-description`, `fix/short-description`, `chore/short-description`

## Key Architecture Notes

- Screener engine uses a Postgres RPC function (`run_screen()`) against the `latest_stock_snapshot` materialized view
- FMP API responses are cached in Redis with 15-min TTL
- AI theses are cached in Redis (24h TTL) and persisted in `ai_theses` table (7-day expiry)
- Vercel cron triggers data refresh: financials (daily), prices (every 15 min during market hours)
- After data refresh, the materialized view is refreshed via `refresh_stock_snapshot()`

## Reference Docs

- See `PLAN.md` for full architecture, DB schemas, screener engine details, and component hierarchy
- See `PROGRESS.md` for implementation task checklist
