# Implementation Plan: Stock Screener + AI Thesis Generator

## 1. Complete File Structure
```text
.
├── src/
│   ├── app/                    # Next.js App Router root
│   │   ├── api/                # API route handlers
│   │   │   ├── screener/       # Screener-specific endpoints
│   │   │   │   ├── configs/    # GET user configs, GET/DELETE specific config
│   │   │   │   ├── presets/    # GET preset strategies
│   │   │   │   ├── run/        # POST execute screening
│   │   │   │   └── save/       # POST save screener config
│   │   │   ├── thesis/         # AI thesis endpoints
│   │   │   │   ├── [stockId]/  # GET cached thesis
│   │   │   │   ├── batch/      # POST generate multiple theses
│   │   │   │   ├── generate/   # POST generate individual thesis
│   │   │   │   └── regenerate/ # POST regenerate thesis with new tone
│   │   │   ├── stocks/         # Stock data endpoints
│   │   │   │   ├── [ticker]/   # GET stock profile and history
│   │   │   │   ├── search/     # GET ticker search
│   │   │   │   └── sectors/    # GET available sectors
│   │   │   ├── watchlist/      # Watchlist management
│   │   │   │   ├── [id]/       # DELETE/PATCH watchlist item
│   │   │   │   ├── add/        # POST add to watchlist
│   │   │   │   └── route.ts    # GET user watchlist
│   │   │   └── data/           # Internal/Cron data pipeline
│   │   │       ├── refresh-earnings/   # POST weekly earnings update
│   │   │       ├── refresh-financials/ # POST daily financial data update
│   │   │       └── refresh-prices/     # POST 15-min price update
│   │   ├── dashboard/          # Main user dashboard page
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx     # Dashboard skeleton loader
│   │   │   └── error.tsx       # Dashboard error boundary
│   │   ├── screener/           # Custom screener builder and results
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx     # Screener skeleton loader
│   │   │   ├── error.tsx       # Screener error boundary
│   │   │   ├── presets/        # Browse pre-built strategies
│   │   │   └── results/[id]/   # Specific screening results
│   │   ├── stock/              # Stock pages
│   │   │   └── [ticker]/       # Individual stock details
│   │   │       ├── page.tsx
│   │   │       ├── loading.tsx
│   │   │       └── error.tsx
│   │   ├── watchlist/          # Full watchlist management view
│   │   ├── settings/           # Account settings page
│   │   ├── login/              # Auth login page
│   │   ├── signup/             # Auth signup page
│   │   ├── layout.tsx          # Root layout (nav, providers, footer)
│   │   ├── error.tsx           # Global error boundary
│   │   ├── not-found.tsx       # Custom 404 page
│   │   └── page.tsx            # Landing page (marketing/demo)
│   ├── components/             # Reusable React components
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── screener/           # Screener specific (filters, result table)
│   │   ├── thesis/             # AI thesis cards, confidence badges
│   │   ├── charts/             # Sparklines, historical price charts
│   │   ├── layout/             # Sidebar, Navbar, Footer
│   │   └── shared/             # General reusable (skeletons, error states, stock symbols)
│   ├── lib/                    # Utility functions and core logic
│   │   ├── supabase/           # Supabase client (client/server variants)
│   │   ├── fmp/                # Financial Modeling Prep API client
│   │   ├── claude/             # Anthropic Claude API client
│   │   ├── validators/         # Zod schemas for API input validation
│   │   │   ├── screener.ts     # Screener filter/config schemas
│   │   │   ├── thesis.ts       # Thesis generation request schemas
│   │   │   ├── watchlist.ts    # Watchlist operation schemas
│   │   │   └── stocks.ts       # Stock query schemas
│   │   ├── utils.ts            # General helpers (Tailwind merge, etc.)
│   │   └── format.ts           # Number/Currency/Date formatting
│   ├── types/                  # TypeScript interface definitions
│   │   ├── index.ts            # Shared models (inferred from Zod where possible)
│   │   └── database.types.ts   # Supabase generated types
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-screener.ts     # Manage screener state (wraps TanStack Query)
│   │   └── use-watchlist.ts    # Manage watchlist state (wraps TanStack Query)
│   └── providers/              # React context providers
│       ├── query-provider.tsx  # TanStack Query provider
│       └── toast-provider.tsx  # Toast notification provider
├── supabase/                   # Supabase configuration and migrations
│   ├── migrations/             # SQL definitions in sequence
│   └── config.toml             # Local Supabase settings
├── public/                     # Static assets (images, icons)
├── middleware.ts               # Auth session refresh + route protection
├── package.json                # Project dependencies and scripts
├── tailwind.config.ts          # Tailwind CSS settings
├── tsconfig.json               # TypeScript configuration
├── vitest.config.ts            # Test configuration
└── .env.local                  # Environment variables
```

## 2. Dependency List

> **Note:** Do not pin specific versions. Use `latest` at project init time to get
> the most current stable releases (Next.js 15, React 19, etc.).

```json
"dependencies": {
  "next": "latest",
  "react": "latest",
  "react-dom": "latest",
  "@supabase/supabase-js": "latest",
  "@supabase/ssr": "latest",
  "@anthropic-ai/sdk": "latest",
  "@tanstack/react-query": "latest",
  "tailwindcss": "latest",
  "lucide-react": "latest",
  "clsx": "latest",
  "tailwind-merge": "latest",
  "zod": "latest",
  "recharts": "latest",
  "lightweight-charts": "latest",
  "@upstash/redis": "latest",
  "@radix-ui/react-slot": "latest",
  "@radix-ui/react-dialog": "latest",
  "@radix-ui/react-dropdown-menu": "latest",
  "@radix-ui/react-select": "latest",
  "@radix-ui/react-toast": "latest",
  "@radix-ui/react-tooltip": "latest",
  "class-variance-authority": "latest"
},
"devDependencies": {
  "typescript": "latest",
  "@types/node": "latest",
  "@types/react": "latest",
  "@types/react-dom": "latest",
  "eslint": "latest",
  "eslint-config-next": "latest",
  "postcss": "latest",
  "supabase": "latest",
  "vitest": "latest",
  "@testing-library/react": "latest",
  "@vitejs/plugin-react": "latest"
}
```

## 3. Client-Side State Management

All server state is managed through **TanStack Query (React Query)**. This gives us:
- Automatic caching and deduplication of requests
- Background refetching for stale data
- Optimistic updates for watchlist mutations
- Consistent loading/error state handling

### Query Key Convention
```ts
// All query keys follow a hierarchical structure:
['stocks', ticker]                    // Single stock profile
['stocks', 'search', query]          // Ticker search
['financials', ticker]               // Stock financials
['prices', ticker]                   // Stock price data
['screener', 'presets']              // Preset strategies
['screener', 'configs']              // User saved configs
['screener', 'results', configId]    // Screening results
['thesis', stockId]                  // Cached thesis for stock
['watchlist']                        // User watchlist
```

### Custom Hooks (wrapping TanStack Query)
- `use-screener.ts` — manages filter builder state locally + `useMutation` for running screens
- `use-watchlist.ts` — `useQuery` for list + `useMutation` with optimistic add/remove

## 4. Caching Strategy

### Layer 1: TanStack Query (Client)
- Stock profiles: `staleTime: 5 min`, `gcTime: 30 min`
- Screener results: `staleTime: 0` (always fresh on re-run)
- Watchlist: `staleTime: 1 min` with optimistic updates
- Thesis data: `staleTime: 24 hours` (matches DB expiry)

### Layer 2: Upstash Redis (Server)
- **FMP API responses:** Cache with 15-min TTL to stay within FMP rate limits
- **Thesis generation:** Cache completed thesis JSON by `(stockId, strategyType, tone)` key with 24-hour TTL
- **Screener preset results:** Cache popular preset results with 1-hour TTL

### Layer 3: Next.js Route Caching
- `/api/stocks/sectors` — `revalidate: 86400` (daily, sectors rarely change)
- `/api/screener/presets` — `revalidate: 3600` (hourly)
- Stock profile pages (`/stock/[ticker]`) — ISR with `revalidate: 300` (5 min)

### Thesis Cache Invalidation
- Theses stored in `ai_theses` table with `expires_at` set to **7 days** from generation
- When user requests a thesis: check DB first → if valid and not expired, return cached → otherwise generate fresh
- Regenerate endpoint always bypasses cache and writes new entry
- Financial data changes (via cron) do NOT auto-invalidate theses — user explicitly regenerates

## 5. Input Validation (Zod)

All API route handlers validate incoming requests using Zod schemas before processing. Schemas live in `src/lib/validators/` and serve double duty: runtime validation + TypeScript type inference.

```ts
// Example: src/lib/validators/screener.ts
import { z } from 'zod';

export const FilterSchema = z.object({
  metric: z.string(),
  operator: z.enum(['gt', 'lt', 'gte', 'lte', 'between', 'eq']),
  value: z.number(),
  value2: z.number().optional(), // For 'between' operator
});

export const RunScreenerSchema = z.object({
  configId: z.string().uuid().optional(),
  filters: z.array(FilterSchema).min(1).max(20),
  logic: z.enum(['AND', 'OR']).default('AND'),
  universe: z.enum(['sp500', 'russell1000', 'russell2000', 'nasdaq100', 'full']),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(100).default(25),
});

// Infer TypeScript types from Zod schemas
export type Filter = z.infer<typeof FilterSchema>;
export type RunScreenerInput = z.infer<typeof RunScreenerSchema>;
```

### Validation Pattern in API Routes
```ts
// In route handlers:
const body = await request.json();
const parsed = RunScreenerSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}
// Use parsed.data (fully typed) from here
```

## 6. Task Decomposition

### Phase 1: Foundation (Days 1-2)
1. **Initialize Next.js App**
   - **Files:** `/package.json`, `/tailwind.config.ts`, `/src/app/layout.tsx`, `/src/providers/*`
   - **Dependencies:** None
   - **Parallel:** No
   - **Complexity:** Simple
   - **Notes:** Setup TanStack Query provider, Toast provider, and global error boundary in layout
2. **Setup Auth Middleware & Supabase Schema**
   - **Files:** `/middleware.ts`, `/supabase/migrations/*`, `/src/lib/supabase/client.ts`, `/src/lib/supabase/server.ts`
   - **Dependencies:** Task 1
   - **Parallel:** No
   - **Complexity:** Medium
   - **Notes:** Middleware handles session refresh on every request + redirects unauthenticated users from protected routes (`/dashboard`, `/screener`, `/watchlist`, `/settings`)
3. **Build Auth UI (Login/Signup)**
   - **Files:** `/src/app/login/page.tsx`, `/src/app/signup/page.tsx`
   - **Dependencies:** Task 2
   - **Parallel:** Yes (with Task 4)
   - **Complexity:** Simple
4. **Data Pipeline Stub (FMP Integration)**
   - **Files:** `/src/lib/fmp/client.ts`, `/src/app/api/data/refresh-financials/route.ts`, `/src/app/api/data/refresh-prices/route.ts`
   - **Dependencies:** Task 2
   - **Parallel:** Yes (with Task 3)
   - **Complexity:** Medium
   - **Notes:** FMP client includes Redis caching layer for API responses (15-min TTL)

### Phase 2: Screener Engine (Days 3-5)
5. **Implement Screener Engine & Filtering Logic**
   - **Files:** `/src/lib/screener/engine.ts`, `/src/lib/screener/filters.ts`, `/src/lib/validators/screener.ts`, `/src/app/api/screener/presets/route.ts`
   - **Dependencies:** Task 4
   - **Parallel:** Yes
   - **Complexity:** Complex
   - **Notes:** See Section 8 (Screener Engine Architecture) for query strategy details
6. **Screener Custom Builder UI**
   - **Files:** `/src/app/screener/page.tsx`, `/src/app/screener/loading.tsx`, `/src/app/screener/error.tsx`, `/src/components/screener/FilterBuilder.tsx`
   - **Dependencies:** Task 1
   - **Parallel:** Yes
   - **Complexity:** Complex
7. **Screener Results view & Save/Load**
   - **Files:** `/src/components/screener/ResultsTable.tsx`, `/src/app/api/screener/run/route.ts`, `/src/app/api/screener/save/route.ts`
   - **Dependencies:** Task 5, 6
   - **Parallel:** No
   - **Complexity:** Medium

### Phase 3: AI Thesis Generator (Days 6-8)
8. **Claude API Integration & Prompt Engineering**
   - **Files:** `/src/lib/claude/client.ts`, `/src/lib/claude/prompts.ts`, `/src/lib/validators/thesis.ts`
   - **Dependencies:** Task 4
   - **Parallel:** Yes
   - **Complexity:** Complex
9. **Thesis Generation Endpoints**
   - **Files:** `/src/app/api/thesis/generate/route.ts`, `/src/app/api/thesis/batch/route.ts`, `/src/app/api/thesis/regenerate/route.ts`
   - **Dependencies:** Task 8
   - **Parallel:** No
   - **Complexity:** Medium
   - **Notes:** Implements Redis thesis caching (24h TTL) and DB persistence (7-day expiry)
10. **Thesis UI Components**
    - **Files:** `/src/components/thesis/ThesisCard.tsx`, `/src/components/thesis/ConfidenceBadge.tsx`, `/src/components/thesis/ToneSelector.tsx`
    - **Dependencies:** Task 7
    - **Parallel:** Yes
    - **Complexity:** Medium

### Phase 4: Dashboard, Watchlist, and Polish (Days 9-12)
11. **Dashboard & Watchlist Core**
    - **Files:** `/src/app/dashboard/page.tsx`, `/src/app/dashboard/loading.tsx`, `/src/app/watchlist/page.tsx`, `/src/app/api/watchlist/route.ts`, `/src/hooks/use-watchlist.ts`
    - **Dependencies:** Task 2
    - **Parallel:** Yes
    - **Complexity:** Medium
    - **Notes:** Watchlist uses TanStack Query with optimistic updates for add/remove
12. **Individual Stock Profile Pages**
    - **Files:** `/src/app/stock/[ticker]/page.tsx`, `/src/app/stock/[ticker]/loading.tsx`, `/src/components/charts/PriceChart.tsx`
    - **Dependencies:** Task 4, 10
    - **Parallel:** Yes
    - **Complexity:** Medium
    - **Notes:** Uses ISR with 5-min revalidation. Chart toggles between Recharts (sparkline) and Lightweight Charts (full interactive)
13. **Export & Sharing functionality**
    - **Files:** `/src/lib/export.ts`, `/src/app/screener/results/[id]/page.tsx`
    - **Dependencies:** Task 7, 10
    - **Parallel:** Yes
    - **Complexity:** Medium

### Phase 5: Deployment and Hardening (Days 13-14)
14. **Cron Jobs & DB Optimizations**
    - **Files:** `/vercel.json` (cron), Supabase indices & materialized view check
    - **Dependencies:** Task 4, 11
    - **Parallel:** Yes
    - **Complexity:** Simple
15. **Rate Limiting & Security Pass**
    - **Files:** `/src/middleware.ts` (extend with Upstash rate limiting)
    - **Dependencies:** All Endpoints
    - **Parallel:** No
    - **Complexity:** Medium
16. **Final QA & Deployment**
    - **Files:** Environment Setup on Vercel
    - **Dependencies:** Task 14, 15
    - **Parallel:** No
    - **Complexity:** Simple

### Post-MVP: Future Enhancements
- **Side-by-Side Stock Comparison View** (`/compare` page) — deferred to keep MVP timeline realistic
- **Advanced screener filters** — relative filters like "P/E below sector average"
- **Email/push alerts** for watchlist price targets and earnings dates
- **Public sharing** of screening configs via shareable URLs

## 7. Database Migration Order (SQL)

### 001_initial_schema.sql
```sql
-- Create users table (extending Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: RLS policies to be added after table creations.
```

### 002_stocks_schema.sql
```sql
CREATE TABLE stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    sector TEXT,
    industry TEXT,
    market_cap BIGINT,
    exchange TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_stocks_ticker ON stocks(ticker);
CREATE INDEX idx_stocks_sector ON stocks(sector);

-- Fundamental financial data (updated daily via cron)
CREATE TABLE stock_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    -- Valuation
    pe_ratio DECIMAL,
    forward_pe DECIMAL,
    pb_ratio DECIMAL,
    ps_ratio DECIMAL,
    ev_ebitda DECIMAL,
    peg_ratio DECIMAL,
    -- Dividends
    dividend_yield DECIMAL,
    payout_ratio DECIMAL,
    -- Profitability
    roe DECIMAL,
    roa DECIMAL,
    roic DECIMAL,
    -- Balance Sheet
    debt_equity DECIMAL,
    current_ratio DECIMAL,
    interest_coverage DECIMAL,
    -- Growth
    revenue_growth_yoy DECIMAL,
    revenue_growth_3y DECIMAL,
    eps_growth_yoy DECIMAL,
    -- Margins
    gross_margin DECIMAL,
    operating_margin DECIMAL,
    net_margin DECIMAL,
    -- Earnings
    next_earnings_date DATE,
    earnings_beat_rate_4q DECIMAL,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stock_id, date)
);
CREATE INDEX idx_financials_stock_id ON stock_financials(stock_id);
CREATE INDEX idx_financials_date ON stock_financials(date DESC);

-- Price and technical data (updated every 15 min via cron during market hours)
CREATE TABLE stock_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    price_current DECIMAL NOT NULL,
    price_open DECIMAL,
    price_high DECIMAL,
    price_low DECIMAL,
    price_close DECIMAL,
    price_52w_high DECIMAL,
    price_52w_low DECIMAL,
    sma_50 DECIMAL,
    sma_200 DECIMAL,
    rsi_14 DECIMAL,
    relative_strength_sp500 DECIMAL,
    avg_volume_30d BIGINT,
    volume BIGINT,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stock_id, date)
);
CREATE INDEX idx_prices_stock_id ON stock_prices(stock_id);
CREATE INDEX idx_prices_date ON stock_prices(date DESC);
```

### 003_latest_snapshot_view.sql
```sql
-- Materialized view joining latest financials + latest price for each stock.
-- The screener engine queries this view instead of scanning full history tables.
-- Refreshed after each cron data pipeline run.

CREATE MATERIALIZED VIEW latest_stock_snapshot AS
SELECT
    s.id AS stock_id,
    s.ticker,
    s.company_name,
    s.sector,
    s.industry,
    s.market_cap,
    s.exchange,
    -- Financials (latest row per stock)
    f.pe_ratio, f.forward_pe, f.pb_ratio, f.ps_ratio, f.ev_ebitda, f.peg_ratio,
    f.dividend_yield, f.payout_ratio,
    f.roe, f.roa, f.roic,
    f.debt_equity, f.current_ratio, f.interest_coverage,
    f.revenue_growth_yoy, f.revenue_growth_3y, f.eps_growth_yoy,
    f.gross_margin, f.operating_margin, f.net_margin,
    f.next_earnings_date, f.earnings_beat_rate_4q,
    -- Prices (latest row per stock)
    p.price_current, p.price_52w_high, p.price_52w_low,
    p.sma_50, p.sma_200, p.rsi_14, p.relative_strength_sp500,
    p.avg_volume_30d
FROM stocks s
LEFT JOIN LATERAL (
    SELECT * FROM stock_financials
    WHERE stock_id = s.id
    ORDER BY date DESC LIMIT 1
) f ON true
LEFT JOIN LATERAL (
    SELECT * FROM stock_prices
    WHERE stock_id = s.id
    ORDER BY date DESC LIMIT 1
) p ON true
WHERE s.is_active = true;

-- Index the materialized view for screener queries
CREATE UNIQUE INDEX idx_snapshot_stock_id ON latest_stock_snapshot(stock_id);
CREATE INDEX idx_snapshot_ticker ON latest_stock_snapshot(ticker);
CREATE INDEX idx_snapshot_sector ON latest_stock_snapshot(sector);
CREATE INDEX idx_snapshot_market_cap ON latest_stock_snapshot(market_cap);

-- Helper function to refresh the view (called after cron data updates)
CREATE OR REPLACE FUNCTION refresh_stock_snapshot()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY latest_stock_snapshot;
END;
$$ LANGUAGE plpgsql;
```

### 004_screener_schema.sql
```sql
CREATE TABLE screener_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    strategy_type TEXT CHECK (strategy_type IN ('value', 'growth', 'momentum', 'quality', 'garp', 'custom')),
    filters JSONB NOT NULL,
    sort_by TEXT,
    sort_direction TEXT CHECK (sort_direction IN ('asc', 'desc')),
    universe TEXT CHECK (universe IN ('sp500', 'russell1000', 'russell2000', 'nasdaq100', 'full')),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_configs_user_id ON screener_configs(user_id);

CREATE TABLE screening_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES screener_configs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    results JSONB NOT NULL,
    total_matches INTEGER NOT NULL,
    run_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_results_config_id ON screening_results(config_id);
CREATE INDEX idx_results_user_id ON screening_results(user_id);
```

### 005_thesis_and_watchlist.sql
```sql
CREATE TABLE ai_theses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
    screening_result_id UUID REFERENCES screening_results(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strategy_type TEXT NOT NULL,
    thesis_summary TEXT NOT NULL,
    bull_case JSONB NOT NULL,
    bear_case JSONB NOT NULL,
    catalysts JSONB NOT NULL,
    comparable_companies JSONB NOT NULL,
    confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
    tone TEXT CHECK (tone IN ('conservative', 'moderate', 'aggressive')),
    model_version TEXT NOT NULL,
    financial_snapshot JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);
CREATE INDEX idx_theses_stock_id ON ai_theses(stock_id);
CREATE INDEX idx_theses_user_id ON ai_theses(user_id);
CREATE INDEX idx_theses_lookup ON ai_theses(stock_id, user_id, strategy_type, tone)
    WHERE expires_at > NOW();

CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
    added_from_config_id UUID REFERENCES screener_configs(id) ON DELETE SET NULL,
    notes TEXT,
    alert_on_earnings BOOLEAN DEFAULT TRUE,
    alert_on_price_target DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, stock_id)
);
CREATE INDEX idx_watchlist_user_id ON watchlist_items(user_id);
```

### 006_rls_policies.sql
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE screener_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_theses ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;

-- users: Read own profile
CREATE POLICY "Users view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- stocks, financials, prices (publicly readable)
CREATE POLICY "Public stocks read" ON stocks FOR SELECT USING (true);
CREATE POLICY "Public financials read" ON stock_financials FOR SELECT USING (true);
CREATE POLICY "Public prices read" ON stock_prices FOR SELECT USING (true);

-- screener_configs
CREATE POLICY "Users manage own configs" ON screener_configs USING (auth.uid() = user_id);
CREATE POLICY "Public configs readable" ON screener_configs FOR SELECT USING (is_public = true);

-- screening_results, ai_theses, watchlist (user isolated)
CREATE POLICY "Users manage own results" ON screening_results USING (auth.uid() = user_id);
CREATE POLICY "Users manage own theses" ON ai_theses USING (auth.uid() = user_id);
CREATE POLICY "Users manage own watchlist" ON watchlist_items USING (auth.uid() = user_id);
```

## 8. Screener Engine Architecture

The screener is the core feature. It translates user-defined filter criteria into efficient SQL queries against the `latest_stock_snapshot` materialized view.

### Query Strategy
```text
User Filter Config (JSON)
        │
        ▼
┌──────────────────┐
│  Zod Validation  │  Validate & sanitize all filter inputs
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Query Builder   │  Converts validated filters → parameterized SQL WHERE clauses
└──────┬───────────┘
       │
       ▼
┌──────────────────────────────┐
│  Supabase .rpc() call        │  Executes a Postgres function that queries
│  → fn: run_screen(filters)   │  the latest_stock_snapshot materialized view
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────┐
│  Paginated JSON  │  Returns ranked results with pagination metadata
└──────────────────┘
```

### Filter-to-SQL Mapping
Each filter from the UI maps to a WHERE clause condition on the materialized view:
- `{ metric: "pe_ratio", operator: "lt", value: 15 }` → `WHERE pe_ratio < $1`
- `{ metric: "roe", operator: "between", value: 15, value2: 30 }` → `WHERE roe BETWEEN $1 AND $2`
- Multiple filters combine with the `logic` field: `AND` (all must match) or `OR` (any must match)

### Supabase RPC Function
```sql
-- Postgres function called by the screener API
-- Accepts a JSONB array of filters and returns matching stocks
CREATE OR REPLACE FUNCTION run_screen(
    p_filters JSONB,
    p_logic TEXT DEFAULT 'AND',
    p_universe TEXT DEFAULT 'full',
    p_sort_by TEXT DEFAULT 'market_cap',
    p_sort_dir TEXT DEFAULT 'desc',
    p_limit INTEGER DEFAULT 25,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    stock_id UUID,
    ticker TEXT,
    company_name TEXT,
    sector TEXT,
    market_cap BIGINT,
    matched_metrics JSONB,
    total_count BIGINT
) AS $$
DECLARE
    filter_clause TEXT := '';
    single_filter JSONB;
    connector TEXT;
BEGIN
    -- Build dynamic WHERE clause from filters
    connector := CASE WHEN p_logic = 'OR' THEN ' OR ' ELSE ' AND ' END;

    FOR single_filter IN SELECT * FROM jsonb_array_elements(p_filters)
    LOOP
        IF filter_clause != '' THEN
            filter_clause := filter_clause || connector;
        END IF;

        filter_clause := filter_clause || format(
            '%I %s %s',
            single_filter->>'metric',
            CASE (single_filter->>'operator')
                WHEN 'gt' THEN '>'
                WHEN 'gte' THEN '>='
                WHEN 'lt' THEN '<'
                WHEN 'lte' THEN '<='
                WHEN 'eq' THEN '='
                WHEN 'between' THEN 'BETWEEN'
            END,
            CASE (single_filter->>'operator')
                WHEN 'between' THEN
                    (single_filter->>'value') || ' AND ' || (single_filter->>'value2')
                ELSE
                    (single_filter->>'value')
            END
        );
    END LOOP;

    RETURN QUERY EXECUTE format(
        'SELECT stock_id, ticker, company_name, sector, market_cap,
                to_jsonb(lss) AS matched_metrics,
                COUNT(*) OVER() AS total_count
         FROM latest_stock_snapshot lss
         WHERE (%s)
         ORDER BY %I %s
         LIMIT %s OFFSET %s',
        filter_clause, p_sort_by, p_sort_dir, p_limit, p_offset
    );
END;
$$ LANGUAGE plpgsql STABLE;
```

### Allowed Metric Names (Whitelist)
The query builder only allows filtering on columns that exist in `latest_stock_snapshot`. The Zod validator enforces this whitelist:
```ts
const ALLOWED_METRICS = [
  'pe_ratio', 'forward_pe', 'pb_ratio', 'ps_ratio', 'ev_ebitda', 'peg_ratio',
  'dividend_yield', 'payout_ratio', 'roe', 'roa', 'roic',
  'debt_equity', 'current_ratio', 'interest_coverage',
  'revenue_growth_yoy', 'revenue_growth_3y', 'eps_growth_yoy',
  'gross_margin', 'operating_margin', 'net_margin',
  'price_current', 'price_52w_high', 'price_52w_low',
  'sma_50', 'sma_200', 'rsi_14', 'relative_strength_sp500',
  'avg_volume_30d', 'market_cap',
] as const;
```

## 9. Component Hierarchy
```text
App (Layout)
├── QueryProvider (TanStack Query)
├── ToastProvider (Notifications)
├── Navbar
│   ├── UserProfileDropdown
│   └── GlobalSearch (Ticker search)
├── MainContent
│   ├── [Dashboard]
│   │   ├── StatCards
│   │   ├── RecentScreeningsList
│   │   │   └── ScreeningRow
│   │   └── WatchlistWidget
│   │       └── SparklineChart
│   ├── [Screener Interface]
│   │   ├── ScreenerHeader (Actions: Save, Load, Presets)
│   │   ├── FilterBuilder
│   │   │   ├── FilterRow
│   │   │   │   ├── MetricSelector
│   │   │   │   ├── OperatorSelector (>, <, between, =)
│   │   │   │   └── ThresholdInput
│   │   │   ├── LogicToggle (AND / OR)
│   │   │   └── AddFilterButton
│   │   ├── ResultsTable
│   │   │   ├── SortableHeader
│   │   │   └── StockRow (Inline Thesis Expand Toggle)
│   │   │       └── ExpandableThesisCard
│   │   └── Pagination
│   ├── [ThesisCard Context]
│   │   ├── ConfidenceBadge
│   │   ├── ThesisSummary
│   │   ├── BullBearPoints
│   │   ├── CatalystList
│   │   └── ToneSelector (Regenerate CTA)
│   └── [Stock Profile]
│       ├── StockHeader (Price, Change, Meta)
│       ├── PriceChart (Recharts / Lightweight)
│       ├── KeyMetricsGrid
│       └── HistoricalThesesList
└── Footer
```

## 10. Error Handling & Loading UX

### Error Boundaries
- **Global:** `src/app/error.tsx` catches unhandled errors app-wide with a "Something went wrong" fallback + retry button
- **Per-route:** Each major route (`/dashboard`, `/screener`, `/stock/[ticker]`) has its own `error.tsx` with contextual messaging (e.g., "Could not load stock data for AAPL")

### Loading States
- **Per-route:** Each major route has a `loading.tsx` with skeleton components matching the page layout
- **Component-level:** TanStack Query `isLoading` / `isFetching` states drive inline spinners and skeleton cards
- **Thesis generation:** Long-running generation shows a streaming progress indicator ("Analyzing financials... Building thesis... Generating recommendations...")

### Toast Notifications
- Success: Watchlist add/remove, config saved, thesis generated
- Error: API failures, rate limit exceeded, network issues
- Info: Background data refresh completed

### API Error Response Format
All API routes return consistent error shapes:
```ts
// Success
{ data: T }
// Error
{ error: { message: string, code?: string, details?: Record<string, string[]> } }
```

## 11. API Route Specifications

| Route | Method | Input (Zod-validated) | Output | Error Cases |
|-------|--------|-----------------------|--------|-------------|
| `/api/screener/run` | POST | `RunScreenerSchema` | `{ data: { results: StockResult[], totalMatches: number, page: number, pageSize: number } }` | 400 Validation Error, 500 DB Error |
| `/api/screener/save` | POST | `SaveConfigSchema` | `{ data: { config: ScreenerConfig } }` | 400 Validation, 401 Unauthorized |
| `/api/screener/presets` | GET | — | `{ data: { presets: PresetConfig[] } }` | 500 DB Error |
| `/api/thesis/generate` | POST | `GenerateThesisSchema` | `{ data: { thesis: AIThesis } }` | 400 Validation, 429 Rate Limit, 502 LLM Error |
| `/api/thesis/batch` | POST | `BatchThesisSchema` | `{ data: { theses: AIThesis[], failed: string[] } }` | 400 Validation, 429 Rate Limit |
| `/api/thesis/regenerate` | POST | `RegenerateThesisSchema` | `{ data: { thesis: AIThesis } }` | 400 Validation, 429 Rate Limit, 502 LLM Error |
| `/api/thesis/[stockId]` | GET | `stockId` (URL param) | `{ data: { thesis: AIThesis \| null } }` | 404 Not Found |
| `/api/watchlist` | GET | — | `{ data: { items: WatchlistItem[] } }` | 401 Unauthorized |
| `/api/watchlist/add` | POST | `AddWatchlistSchema` | `{ data: { item: WatchlistItem } }` | 401 Unauthorized, 409 Already Exists |
| `/api/watchlist/[id]` | DELETE | `id` (URL param) | `{ data: { success: true } }` | 401 Unauthorized, 404 Not Found |
| `/api/stocks/[ticker]` | GET | `ticker` (URL param) | `{ data: { profile: Stock, financials: Financials, prices: PriceData[] } }` | 404 Not Found |
| `/api/stocks/search` | GET | `?q=query` | `{ data: { results: StockSearchResult[] } }` | 400 Empty Query |
| `/api/stocks/sectors` | GET | — | `{ data: { sectors: string[] } }` | 500 DB Error |
| `/api/data/refresh-financials` | POST | `{ authorization: cron-secret }` | `{ data: { processed: number, successes: number, failures: number } }` | 401 Unauthorized |
| `/api/data/refresh-prices` | POST | `{ authorization: cron-secret }` | `{ data: { processed: number, successes: number, failures: number } }` | 401 Unauthorized |

*(All private routes require an active session cookie verified via Supabase Auth. Returns 401 if missing).*

## 12. Data Flow Diagrams

### Primary Data Flow: Stock Screening & Thesis Generation
```text
[FMP API] ──1──> [Cron: refresh-financials] ──2──> [Supabase: stock_financials]
                                                              │
[FMP API] ──1──> [Cron: refresh-prices]     ──2──> [Supabase: stock_prices]
                                                              │
                                                     3 (REFRESH MATERIALIZED VIEW)
                                                              │
                                                              ▼
                                                   [latest_stock_snapshot]
                                                              │
[UI] ──4──> [API: /screener/run] ──5──> [run_screen() RPC] ──┘
  │                                           │
  6                                           │ (Returns paginated JSON)
  ▼                                           ▼
[UI Results Table] ──7──> [API: /thesis/generate]
                                   │
                          8 (Check Redis cache)
                          9 (If miss → Claude API)
                         10 (Store in Redis + DB)
                                   │
                                   ▼
                          [Supabase: ai_theses]
```

**Steps:**
1. Vercel cron triggers `refresh-financials` (daily) and `refresh-prices` (every 15 min during market hours).
2. Fetches from FMP API (with Redis caching to respect rate limits) and upserts into respective tables.
3. After data refresh, calls `refresh_stock_snapshot()` to rebuild the materialized view.
4. User configures filters and clicks "Run Screener".
5. API validates input via Zod, then calls `run_screen()` Postgres function against the materialized view.
6. Returns paginated results to UI.
7. User clicks "Generate Thesis" on a result row.
8. API checks Redis cache for existing thesis matching `(stockId, strategyType, tone)`.
9. On cache miss: reads financial snapshot from DB, sends structured prompt to Claude API.
10. Claude returns structured JSON thesis. Stored in Redis (24h TTL) + Supabase `ai_theses` (7-day expiry). Returned to UI.

## 13. Testing Strategy

### Integration Tests (Priority)
- **Screener engine:** Test filter-to-SQL mapping, pagination, edge cases (empty filters, invalid metrics, no results)
- **Thesis generation API:** Test Zod validation, cache hit/miss paths, error handling for Claude API failures
- **Auth middleware:** Test protected route redirects, session refresh, expired tokens

### Component Tests
- **FilterBuilder:** Test adding/removing filters, metric selection, operator changes
- **ResultsTable:** Test sorting, pagination, thesis expand/collapse
- **ThesisCard:** Test rendering of bull/bear cases, confidence badge colors

### Tools
- **Vitest** for unit and integration tests
- **React Testing Library** for component tests
- Test files colocated with source: `*.test.ts` / `*.test.tsx`

### What We Skip (MVP)
- E2E tests (Playwright/Cypress) — add post-MVP
- Visual regression tests
- Load/performance testing
