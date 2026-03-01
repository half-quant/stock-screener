import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { fetchKeyMetrics, fetchFinancialRatios } from '@/lib/fmp/client';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RefreshResult {
  processed: number;
  successes: number;
  failures: number;
}

// ---------------------------------------------------------------------------
// Cron Authentication
// ---------------------------------------------------------------------------

function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error(
      '[refresh-financials] CRON_SECRET is not set — rejecting all requests.',
    );
    return false;
  }

  // Support both Authorization header and the Vercel cron `authorization` header.
  const authHeader =
    request.headers.get('authorization') ??
    request.headers.get('x-cron-secret');

  if (!authHeader) return false;

  // Accept "Bearer <secret>" or plain "<secret>"
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  return token === cronSecret;
}

// ---------------------------------------------------------------------------
// Batch Processing
// ---------------------------------------------------------------------------

const BATCH_SIZE = 10;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// POST /api/data/refresh-financials
// ---------------------------------------------------------------------------

export async function POST(
  request: Request,
): Promise<NextResponse<ApiSuccessResponse<RefreshResult> | ApiErrorResponse>> {
  // 1. Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  const supabase = await createClient();

  // 2. Get all active stock tickers
  const { data: stocks, error: stocksError } = await supabase
    .from('stocks')
    .select('id, ticker')
    .eq('is_active', true);

  if (stocksError) {
    console.error('[refresh-financials] Failed to fetch stocks:', stocksError);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to fetch active stocks from database',
          code: 'DB_ERROR',
        },
      },
      { status: 500 },
    );
  }

  if (!stocks || stocks.length === 0) {
    return NextResponse.json({
      data: { processed: 0, successes: 0, failures: 0 },
    });
  }

  // 3. Process stocks in batches
  let successes = 0;
  let failures = 0;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
    const batch = stocks.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (stock) => {
        const [keyMetrics, ratios] = await Promise.all([
          fetchKeyMetrics(stock.ticker),
          fetchFinancialRatios(stock.ticker),
        ]);

        if (!keyMetrics && !ratios) {
          throw new Error(
            `No financial data returned for ${stock.ticker}`,
          );
        }

        // Map FMP stable API data to our stock_financials schema
        const financialRecord = {
          stock_id: stock.id as string,
          date: today,
          // Valuation (from ratios)
          pe_ratio: ratios?.priceToEarningsRatio ?? null,
          forward_pe: null,
          pb_ratio: ratios?.priceToBookRatio ?? null,
          ps_ratio: ratios?.priceToSalesRatio ?? null,
          ev_ebitda: keyMetrics?.evToEBITDA ?? null,
          peg_ratio: ratios?.priceEarningsToGrowthRatio ?? null,
          // Dividends
          dividend_yield: keyMetrics?.dividendYield ?? ratios?.dividendYield ?? null,
          payout_ratio: keyMetrics?.payoutRatio ?? ratios?.dividendPayoutRatio ?? null,
          // Profitability
          roe: keyMetrics?.returnOnEquity ?? ratios?.returnOnEquity ?? null,
          roa: keyMetrics?.returnOnAssets ?? ratios?.returnOnAssets ?? null,
          roic: keyMetrics?.returnOnInvestedCapital ?? keyMetrics?.roic ?? null,
          // Balance sheet
          debt_equity: keyMetrics?.debtToEquity ?? ratios?.debtEquityRatio ?? null,
          current_ratio: keyMetrics?.currentRatio ?? ratios?.currentRatio ?? null,
          interest_coverage: keyMetrics?.interestCoverage ?? ratios?.interestCoverage ?? null,
          // Growth — requires multiple periods; set to null for single-period fetch
          revenue_growth_yoy: null,
          revenue_growth_3y: null,
          eps_growth_yoy: null,
          // Margins
          gross_margin: ratios?.grossProfitMargin ?? null,
          operating_margin: ratios?.operatingProfitMargin ?? null,
          net_margin: ratios?.netProfitMargin ?? null,
          // Earnings
          next_earnings_date: null,
          earnings_beat_rate_4q: null,
          fetched_at: new Date().toISOString(),
        };

        // 4. Upsert into stock_financials (unique on stock_id + date)
        const { error: upsertError } = await supabase
          .from('stock_financials')
          .upsert(financialRecord, {
            onConflict: 'stock_id,date',
          });

        if (upsertError) {
          throw new Error(
            `Upsert failed for ${stock.ticker}: ${upsertError.message}`,
          );
        }
      }),
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        successes++;
      } else {
        failures++;
        console.error(
          '[refresh-financials] Batch item failed:',
          result.reason,
        );
      }
    }

    // Brief pause between batches to avoid overwhelming FMP API
    if (i + BATCH_SIZE < stocks.length) {
      await delay(1000);
    }
  }

  // 5. Refresh the materialized view
  const { error: rpcError } = await supabase.rpc('refresh_stock_snapshot');
  if (rpcError) {
    console.error(
      '[refresh-financials] Failed to refresh materialized view:',
      rpcError,
    );
    // Non-fatal — data is still updated, view will catch up on next refresh
  }

  // 6. Return results
  return NextResponse.json({
    data: {
      processed: stocks.length,
      successes,
      failures,
    },
  });
}
