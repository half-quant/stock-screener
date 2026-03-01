import { z } from 'zod';

/**
 * Input schema for adding a stock to the user's watchlist.
 * Validated by the POST /api/watchlist/add endpoint.
 */
export const AddWatchlistSchema = z.object({
  stockId: z.string().uuid(),
  notes: z.string().max(500).optional(),
  alertOnEarnings: z.boolean().optional(),
  alertOnPriceTarget: z.number().positive().optional(),
});

// Inferred TypeScript types
export type AddWatchlistInput = z.infer<typeof AddWatchlistSchema>;
