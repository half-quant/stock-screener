# Stock Screener Project Context
- This is a Next.js 15 App Router application with TypeScript
- Database is Supabase (PostgreSQL with PostgREST)
- AI thesis generation uses Claude API (claude-opus-4-6)
- Financial data comes from Financial Modeling Prep API (FMP)
- Free tier: 250 API requests/day — every data fetch must be cached
- All financial calculations must handle null/undefined data gracefully
- Never display financial data without a "as of" timestamp
- All money values displayed with 2 decimal places, ratios with 1 decimal