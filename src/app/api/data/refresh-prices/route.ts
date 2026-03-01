import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { fetchStockPrice } from '@/lib/fmp/client';
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
      '[refresh-prices] CRON_SECRET is not set — rejecting all requests.',
    );
    return false;
  }

  const authHeader =
    request.headers.get('authorization') ??
    request.headers.get('x-cron-secret');

  if (!authHeader) return false;

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
// POST /api/data/refresh-prices
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
    console.error('[refresh-prices] Failed to fetch stocks:', stocksError);
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
        // Fetch quote data (includes 50/200 SMA from the quote endpoint)
        const quote = await fetchStockPrice(stock.ticker);

        if (!quote) {
          throw new Error(`No price data returned for ${stock.ticker}`);
        }

        // Map FMP stable API data to our stock_prices schema
        // SMA 50/200 are available directly from the quote endpoint
        const priceRecord = {
          stock_id: stock.id as string,
          date: today,
          price_current: quote.price,
          price_open: quote.open,
          price_high: quote.dayHigh,
          price_low: quote.dayLow,
          price_close: quote.previousClose,
          price_52w_high: quote.yearHigh,
          price_52w_low: quote.yearLow,
          sma_50: quote.priceAvg50 ?? null,
          sma_200: quote.priceAvg200 ?? null,
          rsi_14: null, // Not available on free tier
          relative_strength_sp500: null,
          avg_volume_30d: null,
          volume: quote.volume,
          fetched_at: new Date().toISOString(),
        };

        // 4. Upsert into stock_prices (unique on stock_id + date)
        const { error: upsertError } = await supabase
          .from('stock_prices')
          .upsert(priceRecord, {
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
        console.error('[refresh-prices] Batch item failed:', result.reason);
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
      '[refresh-prices] Failed to refresh materialized view:',
      rpcError,
    );
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
