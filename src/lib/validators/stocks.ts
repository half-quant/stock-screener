import { z } from 'zod';

/**
 * Schema for validating a stock ticker URL parameter.
 * Tickers are 1-5 uppercase alphabetic characters (e.g., "AAPL", "MSFT").
 */
export const TickerParamSchema = z.object({
  ticker: z
    .string()
    .min(1)
    .max(5)
    .transform((val) => val.toUpperCase())
    .pipe(z.string().regex(/^[A-Z]{1,5}$/, 'Invalid ticker format')),
});

/**
 * Schema for validating stock search query parameters.
 * Used by the GET /api/stocks/search?q=<query> endpoint.
 */
export const StockSearchSchema = z.object({
  q: z.string().min(1).max(20),
});

// Inferred TypeScript types
export type TickerParam = z.infer<typeof TickerParamSchema>;
export type StockSearch = z.infer<typeof StockSearchSchema>;
