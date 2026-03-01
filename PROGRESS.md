# Project Progress Checklist

## Phase 1: Foundation (Days 1-2)

### Round 0 — Project Init (sequential)
- [x] 1a. Scaffold Next.js 15 app, install all dependencies, git init

### Round 1 — App Shell (parallel subagents)
- [x] 1b. **Agent A:** Root layout, landing page, global error boundary, not-found page
- [x] 1c. **Agent B:** Query provider, toast provider, utils.ts, format.ts

### Round 2 — Auth & DB (parallel subagents)
- [x] 2a. **Agent A:** Supabase SQL migrations (001–006), run_screen RPC function
- [x] 2b. **Agent B:** Supabase clients (client.ts, server.ts), auth middleware, Zod validators scaffold

### Round 3 — Auth UI & Data Pipeline (parallel subagents)
- [x] 3. **Agent A:** Auth UI — login/page.tsx, signup/page.tsx, auth callback route
- [x] 4. **Agent B:** FMP client with Redis caching, refresh-financials & refresh-prices API routes, stock search & sectors endpoints

## Phase 2: Screener Engine (Days 3-5)
- [ ] 5. Implement Screener Engine & Filtering Logic (Zod validators, query builder, run_screen RPC, presets)
- [ ] 6. Build Custom Screener UI (FilterBuilder with AND/OR logic, metric/operator selectors)
- [ ] 7. Build Results Table & Filter Config Save/Load

## Phase 3: AI Thesis Generator (Days 6-8)
- [ ] 8. Claude API Integration & Structured Output Prompt Engineering
- [ ] 9. Thesis Generation API Endpoints (generate, batch, regenerate — with Redis caching + DB persistence)
- [ ] 10. Thesis UI Components (ThesisCard, ConfidenceBadge, ToneSelector)

## Phase 4: Dashboard, Watchlist, and Polish (Days 9-12)
- [ ] 11. Dashboard & Watchlist Core Pages (TanStack Query with optimistic updates)
- [ ] 12. Individual Stock Profile Pages (ISR, PriceChart, KeyMetricsGrid)
- [ ] 13. Data Export capabilities (CSV, PDF)

## Phase 5: Deployment and Hardening (Days 13-14)
- [ ] 14. Configure Cron Jobs + DB Optimizations (materialized view refresh, index tuning)
- [ ] 15. Setup Upstash Redis Rate Limiting on APIs
- [ ] 16. Final QA, Integration Tests & Production Deployment

## Post-MVP
- [ ] Side-by-side Stock Comparison View (`/compare`)
- [ ] Advanced screener filters (relative metrics like "P/E below sector average")
- [ ] Email/push alerts for watchlist events
- [ ] E2E tests (Playwright)
