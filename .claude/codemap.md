# Code Map — Stock Screener + AI Thesis Generator

> Auto-generated 2026-03-01. 27 source files, 7 migrations.

## Dependency Flow

```
providers/ ──> lib/utils, lib/supabase
components/layout/ ──> lib/supabase, providers/, lib/utils
app/pages ──> lib/supabase, providers/
app/api/ ──> lib/supabase/server, lib/fmp, lib/validators, types/
lib/fmp/ ──> @upstash/redis (external)
lib/validators/ ──> zod (external)
middleware ──> @supabase/ssr (external)
```

---

## src/types/

| File | Purpose | Key Exports | Deps |
|------|---------|-------------|------|
| `index.ts` | API response envelope types | `ApiSuccessResponse<T>`, `ApiErrorResponse`, `ApiResponse<T>` | — |

## src/lib/

| File | Purpose | Key Exports | Deps |
|------|---------|-------------|------|
| `utils.ts` | className merging (shadcn pattern) | `cn()` | clsx, tailwind-merge |
| `format.ts` | Financial data display formatters | `formatCurrency()`, `formatNumber()`, `formatPercent()`, `formatLargeNumber()`, `formatMarketCap()`, `formatDate()`, `formatRelativeDate()` | — |

## src/lib/supabase/

| File | Purpose | Key Exports | Deps |
|------|---------|-------------|------|
| `client.ts` | Browser Supabase client for Client Components | `createClient()` | @supabase/ssr |
| `server.ts` | Server Supabase client for API routes / Server Components | `createClient()` | @supabase/ssr, next/headers |

## src/lib/fmp/

| File | Purpose | Key Exports | Deps |
|------|---------|-------------|------|
| `client.ts` | FMP stable API client with Redis caching (15-min TTL) | `fetchStockProfile()`, `fetchKeyMetrics()`, `fetchFinancialRatios()`, `fetchStockPrice()`, `fetchHistoricalPrices()`, `searchStocks()` | @upstash/redis |

**Types exported:** `FmpStockProfile`, `FmpKeyMetrics`, `FmpFinancialRatios`, `FmpStockQuote`, `FmpHistoricalPrice`, `FmpSearchResult`

## src/lib/validators/

| File | Purpose | Key Exports | Deps |
|------|---------|-------------|------|
| `screener.ts` | Screener filter/config validation | `ALLOWED_METRICS`, `FilterSchema`, `RunScreenerSchema`, `SaveConfigSchema` + inferred types | zod |
| `thesis.ts` | Thesis generation request validation | `GenerateThesisSchema`, `BatchThesisSchema`, `RegenerateThesisSchema` + inferred types | zod |
| `watchlist.ts` | Watchlist operation validation | `AddWatchlistSchema`, `AddWatchlistInput` | zod |
| `stocks.ts` | Stock search/ticker validation | `TickerParamSchema`, `StockSearchSchema` + inferred types | zod |

## src/providers/

| File | Purpose | Key Exports | Deps |
|------|---------|-------------|------|
| `query-provider.tsx` | TanStack Query provider (staleTime: 5min, retry: 1) | `QueryProvider` | @tanstack/react-query |
| `toast-provider.tsx` | Toast notification system (success/error/info variants) | `ToastProvider`, `useToast()` | @radix-ui/react-toast, lib/utils |

## src/components/

| File | Purpose | Key Exports | Deps |
|------|---------|-------------|------|
| `layout/navbar.tsx` | Sticky nav with links, search trigger, user dropdown, logout | `Navbar` | lib/supabase/client, providers/toast-provider, lib/utils, lucide-react |

## src/middleware.ts

| Purpose | Key Exports | Deps |
|---------|-------------|------|
| Auth session refresh + protected route redirection | `middleware()`, `config` | @supabase/ssr |

**Protected routes:** `/dashboard`, `/screener`, `/watchlist`, `/settings`

## src/app/ — Pages

| File | Purpose | Key Exports | Deps |
|------|---------|-------------|------|
| `layout.tsx` | Root layout: Inter font, providers, navbar wrapping | `RootLayout` | providers/*, components/layout/navbar |
| `page.tsx` | Landing page with hero, CTAs, feature cards | `Home` | next/link |
| `error.tsx` | Global error boundary with retry button | `GlobalError` | — |
| `not-found.tsx` | Custom 404 page | `NotFound` | next/link |
| `login/page.tsx` | Email/password login with redirectTo support | `LoginPage` | lib/supabase/client, providers/toast-provider |
| `signup/page.tsx` | Registration with email confirmation flow | `SignupPage` | lib/supabase/client, providers/toast-provider |

## src/app/api/ — API Routes

| Route | Method | Purpose | Deps |
|-------|--------|---------|------|
| `auth/callback/route.ts` | GET | Exchange Supabase auth code for session | lib/supabase/server |
| `auth/logout/route.ts` | POST | Sign out user server-side | lib/supabase/server |
| `stocks/search/route.ts` | GET | Search stocks via FMP (`?q=query`) | lib/fmp/client, validators/stocks, types/ |
| `stocks/sectors/route.ts` | GET | Distinct sectors from DB (revalidate: 24h) | lib/supabase/server, types/ |
| `data/refresh-financials/route.ts` | POST | Cron: update stock_financials from FMP | lib/supabase/server, lib/fmp/client, types/ |
| `data/refresh-prices/route.ts` | POST | Cron: update stock_prices from FMP | lib/supabase/server, lib/fmp/client, types/ |

## supabase/migrations/

| File | Purpose | Key Objects |
|------|---------|-------------|
| `000000_initial_schema.sql` | User profiles extending auth.users | `users` table |
| `000001_stocks_schema.sql` | Stock data tables | `stocks`, `stock_financials`, `stock_prices` + indexes |
| `000002_latest_snapshot_view.sql` | Screener query target | `latest_stock_snapshot` (materialized view), `refresh_stock_snapshot()` |
| `000003_screener_schema.sql` | Saved screener configs/results | `screener_configs`, `screening_results` |
| `000004_thesis_and_watchlist.sql` | AI theses + user watchlist | `ai_theses` (7-day expiry), `watchlist_items` (unique per user+stock) |
| `000005_rls_policies.sql` | Row-level security on all tables | Public read: stocks/financials/prices. User-isolated: configs/results/theses/watchlist |
| `000006_run_screen_function.sql` | Dynamic SQL screener engine | `run_screen(filters, logic, universe, sort, limit, offset)` → queries materialized view |

## Directories Not Yet Populated

```
src/components/ui/          — shadcn/ui base components (Phase 2)
src/components/screener/    — FilterBuilder, ResultsTable (Phase 2)
src/components/thesis/      — ThesisCard, ConfidenceBadge (Phase 3)
src/components/charts/      — PriceChart, Sparkline (Phase 4)
src/components/shared/      — Skeletons, error states (Phase 4)
src/lib/claude/             — Claude API client + prompts (Phase 3)
src/hooks/                  — use-screener, use-watchlist (Phase 2-4)
src/app/dashboard/          — Dashboard page (Phase 4)
src/app/screener/           — Screener pages (Phase 2)
src/app/stock/[ticker]/     — Stock profile pages (Phase 4)
src/app/watchlist/          — Watchlist page (Phase 4)
src/app/settings/           — Settings page (Phase 4)
```
