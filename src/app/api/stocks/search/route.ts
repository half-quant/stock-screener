import { NextRequest, NextResponse } from 'next/server';

import { StockSearchSchema } from '@/lib/validators/stocks';
import { searchStocks } from '@/lib/fmp/client';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StockSearchResult {
  ticker: string;
  name: string;
  exchange: string;
}

interface SearchResponse {
  results: StockSearchResult[];
}

// ---------------------------------------------------------------------------
// GET /api/stocks/search?q=<query>
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiSuccessResponse<SearchResponse> | ApiErrorResponse>> {
  const searchParams = request.nextUrl.searchParams;

  // 1. Validate input
  const parsed = StockSearchSchema.safeParse({
    q: searchParams.get('q') ?? '',
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const details: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (value) {
        details[key] = value;
      }
    }

    return NextResponse.json(
      {
        error: {
          message: 'Invalid search query',
          code: 'VALIDATION_ERROR',
          details,
        },
      },
      { status: 400 },
    );
  }

  const { q } = parsed.data;

  // 2. Search via FMP API (cached through Redis in fmp/client)
  const fmpResults = await searchStocks(q, 10);

  // 3. Map to our response shape
  const results: StockSearchResult[] = fmpResults.map((item) => ({
    ticker: item.symbol,
    name: item.name,
    exchange: item.exchange,
  }));

  return NextResponse.json({ data: { results } });
}
