import { z } from 'zod';

/**
 * Whitelist of metric names that map to columns in the
 * `latest_stock_snapshot` materialized view. The screener engine
 * only allows filtering on these columns to prevent SQL injection.
 */
export const ALLOWED_METRICS = [
  'pe_ratio',
  'forward_pe',
  'pb_ratio',
  'ps_ratio',
  'ev_ebitda',
  'peg_ratio',
  'dividend_yield',
  'payout_ratio',
  'roe',
  'roa',
  'roic',
  'debt_equity',
  'current_ratio',
  'interest_coverage',
  'revenue_growth_yoy',
  'revenue_growth_3y',
  'eps_growth_yoy',
  'gross_margin',
  'operating_margin',
  'net_margin',
  'price_current',
  'price_52w_high',
  'price_52w_low',
  'sma_50',
  'sma_200',
  'rsi_14',
  'relative_strength_sp500',
  'avg_volume_30d',
  'market_cap',
] as const;

export type AllowedMetric = (typeof ALLOWED_METRICS)[number];

/**
 * A single screener filter condition. Each filter specifies a metric,
 * a comparison operator, and one or two threshold values.
 */
export const FilterSchema = z.object({
  metric: z.enum(ALLOWED_METRICS),
  operator: z.enum(['gt', 'lt', 'gte', 'lte', 'between', 'eq']),
  value: z.number(),
  value2: z.number().optional(), // Required when operator is 'between'
});

/**
 * Input schema for running a stock screen. Validated by the
 * POST /api/screener/run endpoint.
 */
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

/**
 * Input schema for saving a screener configuration.
 * Validated by the POST /api/screener/save endpoint.
 */
export const SaveConfigSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  strategy_type: z.enum(['value', 'growth', 'momentum', 'quality', 'garp', 'custom']),
  filters: z.array(FilterSchema).min(1).max(20),
  universe: z.enum(['sp500', 'russell1000', 'russell2000', 'nasdaq100', 'full']),
  sort_by: z.string().optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
});

// Inferred TypeScript types
export type Filter = z.infer<typeof FilterSchema>;
export type RunScreenerInput = z.infer<typeof RunScreenerSchema>;
export type SaveConfigInput = z.infer<typeof SaveConfigSchema>;
