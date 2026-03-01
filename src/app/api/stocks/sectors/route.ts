import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types';

// ---------------------------------------------------------------------------
// Next.js Route Segment Config
// ---------------------------------------------------------------------------

/** Revalidate every 24 hours — sectors rarely change. */
export const revalidate = 86400;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SectorsResponse {
  sectors: string[];
}

// ---------------------------------------------------------------------------
// GET /api/stocks/sectors
// ---------------------------------------------------------------------------

export async function GET(): Promise<
  NextResponse<ApiSuccessResponse<SectorsResponse> | ApiErrorResponse>
> {
  const supabase = await createClient();

  // Query distinct non-null sectors from the stocks table
  const { data, error } = await supabase
    .from('stocks')
    .select('sector')
    .not('sector', 'is', null)
    .eq('is_active', true);

  if (error) {
    console.error('[stocks/sectors] Failed to fetch sectors:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to fetch sectors from database',
          code: 'DB_ERROR',
        },
      },
      { status: 500 },
    );
  }

  // Extract unique sectors and sort alphabetically
  const uniqueSectors = [
    ...new Set(
      (data ?? [])
        .map((row) => row.sector as string | null)
        .filter((s): s is string => s !== null && s.trim() !== ''),
    ),
  ].sort();

  return NextResponse.json({ data: { sectors: uniqueSectors } });
}
