import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// FMP API Response Types (stable API)
// ---------------------------------------------------------------------------

export interface FmpStockProfile {
  symbol: string;
  companyName: string;
  price: number;
  beta: number;
  marketCap: number;
  lastDividend: number;
  range: string;
  change: number;
  changePercentage: number;
  volume: number;
  averageVolume: number;
  currency: string;
  exchange: string;
  exchangeFullName: string;
  industry: string;
  website: string;
  description: string;
  ceo: string;
  sector: string;
  country: string;
  fullTimeEmployees: string;
  ipoDate: string;
  isActivelyTrading: boolean;
  isEtf: boolean;
  isFund: boolean;
}

export interface FmpKeyMetrics {
  symbol: string;
  date: string;
  fiscalYear: string;
  period: string;
  reportedCurrency: string;
  marketCap: number | null;
  enterpriseValue: number | null;
  evToSales: number | null;
  evToOperatingCashFlow: number | null;
  evToFreeCashFlow: number | null;
  evToEBITDA: number | null;
  netDebtToEBITDA: number | null;
  currentRatio: number | null;
  dividendYield: number | null;
  payoutRatio: number | null;
  returnOnAssets: number | null;
  returnOnEquity: number | null;
  returnOnInvestedCapital: number | null;
  earningsYield: number | null;
  freeCashFlowYield: number | null;
  debtToEquity: number | null;
  interestCoverage: number | null;
  incomeQuality: number | null;
  workingCapital: number | null;
  investedCapital: number | null;
  roic: number | null;
  grahamNumber: number | null;
  grahamNetNet: number | null;
}

export interface FmpFinancialRatios {
  symbol: string;
  date: string;
  fiscalYear: string;
  period: string;
  reportedCurrency: string;
  grossProfitMargin: number | null;
  operatingProfitMargin: number | null;
  netProfitMargin: number | null;
  returnOnAssets: number | null;
  returnOnEquity: number | null;
  returnOnCapitalEmployed: number | null;
  debtEquityRatio: number | null;
  interestCoverage: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  dividendYield: number | null;
  dividendPayoutRatio: number | null;
  priceToEarningsRatio: number | null;
  priceToBookRatio: number | null;
  priceToSalesRatio: number | null;
  priceEarningsToGrowthRatio: number | null;
  priceToFreeCashFlowsRatio: number | null;
  enterpriseValueMultiple: number | null;
  assetTurnover: number | null;
  fixedAssetTurnover: number | null;
  payablesTurnover: number | null;
  receivablesTurnover: number | null;
  inventoryTurnover: number | null;
  ebitMargin: number | null;
  ebitdaMargin: number | null;
}

export interface FmpStockQuote {
  symbol: string;
  name: string;
  price: number;
  changePercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  exchange: string;
  volume: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

export interface FmpHistoricalPrice {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  vwap: number;
}

export interface FmpSearchResult {
  symbol: string;
  name: string;
  currency: string;
  exchangeFullName: string;
  exchange: string;
}

// ---------------------------------------------------------------------------
// Redis Cache Setup
// ---------------------------------------------------------------------------

const FMP_CACHE_TTL_SECONDS = 15 * 60; // 15 minutes
const FMP_BASE_URL = 'https://financialmodelingprep.com/stable';

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      '[FMP Client] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing. ' +
        'Caching is disabled — all requests will hit the FMP API directly.',
    );
    return null;
  }

  return new Redis({ url, token });
}

let _redis: Redis | null | undefined;

function redis(): Redis | null {
  if (_redis === undefined) {
    _redis = getRedisClient();
  }
  return _redis;
}

// ---------------------------------------------------------------------------
// Generic FMP Fetcher (with caching)
// ---------------------------------------------------------------------------

function buildCacheKey(endpoint: string, params: string): string {
  return `fmp:${endpoint}:${params}`;
}

function getFmpApiKey(): string {
  const key = process.env.FMP_API_KEY;
  if (!key) {
    throw new Error(
      '[FMP Client] FMP_API_KEY environment variable is required but not set.',
    );
  }
  return key;
}

/**
 * Core fetch helper that handles caching, error handling, and response parsing.
 *
 * @param endpoint  - The path segment after /stable/ (e.g. "profile")
 * @param params    - Additional query params (excluding apikey)
 * @returns Parsed JSON response, or `null` on failure.
 */
async function fmpFetch<T>(
  endpoint: string,
  params: string = '',
): Promise<T | null> {
  const cacheKey = buildCacheKey(endpoint, params);
  const redisClient = redis();

  // 1. Check Redis cache
  if (redisClient) {
    try {
      const cached = await redisClient.get<T>(cacheKey);
      if (cached !== null && cached !== undefined) {
        return cached;
      }
    } catch (cacheError) {
      console.error('[FMP Client] Redis GET error:', cacheError);
    }
  }

  // 2. Fetch from FMP API
  const apiKey = getFmpApiKey();
  const separator = params ? '&' : '';
  const url = `${FMP_BASE_URL}/${endpoint}?${params}${separator}apikey=${apiKey}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      console.error(
        `[FMP Client] HTTP ${response.status} for ${endpoint}: ${response.statusText}`,
      );
      return null;
    }

    const data = (await response.json()) as T;

    // 3. Cache the response in Redis
    if (redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(data), {
          ex: FMP_CACHE_TTL_SECONDS,
        });
      } catch (cacheError) {
        console.error('[FMP Client] Redis SET error:', cacheError);
      }
    }

    return data;
  } catch (fetchError) {
    console.error(`[FMP Client] Fetch error for ${endpoint}:`, fetchError);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API Functions
// ---------------------------------------------------------------------------

/**
 * Fetch company profile information.
 * FMP stable endpoint: `/stable/profile?symbol={ticker}`
 */
export async function fetchStockProfile(
  ticker: string,
): Promise<FmpStockProfile | null> {
  const data = await fmpFetch<FmpStockProfile[]>(
    'profile',
    `symbol=${encodeURIComponent(ticker)}`,
  );
  if (!data || data.length === 0) return null;
  return data[0];
}

/**
 * Fetch key valuation metrics (most recent period).
 * FMP stable endpoint: `/stable/key-metrics?symbol={ticker}&period=annual&limit=1`
 */
export async function fetchKeyMetrics(
  ticker: string,
): Promise<FmpKeyMetrics | null> {
  const data = await fmpFetch<FmpKeyMetrics[]>(
    'key-metrics',
    `symbol=${encodeURIComponent(ticker)}&period=annual&limit=1`,
  );
  if (!data || data.length === 0) return null;
  return data[0];
}

/**
 * Fetch financial ratios (most recent period).
 * FMP stable endpoint: `/stable/ratios?symbol={ticker}&period=annual&limit=1`
 */
export async function fetchFinancialRatios(
  ticker: string,
): Promise<FmpFinancialRatios | null> {
  const data = await fmpFetch<FmpFinancialRatios[]>(
    'ratios',
    `symbol=${encodeURIComponent(ticker)}&period=annual&limit=1`,
  );
  if (!data || data.length === 0) return null;
  return data[0];
}

/**
 * Fetch current stock price and quote data.
 * FMP stable endpoint: `/stable/quote?symbol={ticker}`
 */
export async function fetchStockPrice(
  ticker: string,
): Promise<FmpStockQuote | null> {
  const data = await fmpFetch<FmpStockQuote[]>(
    'quote',
    `symbol=${encodeURIComponent(ticker)}`,
  );
  if (!data || data.length === 0) return null;
  return data[0];
}

/**
 * Fetch historical daily price data.
 * FMP stable endpoint: `/stable/historical-price-eod/full?symbol={ticker}`
 *
 * @param days Number of calendar days of history to retrieve (default 365).
 */
export async function fetchHistoricalPrices(
  ticker: string,
  days: number = 365,
): Promise<FmpHistoricalPrice[]> {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);

  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];

  const data = await fmpFetch<FmpHistoricalPrice[]>(
    'historical-price-eod/full',
    `symbol=${encodeURIComponent(ticker)}&from=${fromStr}&to=${toStr}`,
  );
  return data ?? [];
}

/**
 * Search for stocks by name.
 * FMP stable endpoint: `/stable/search-name?query={q}&limit={limit}`
 */
export async function searchStocks(
  query: string,
  limit: number = 10,
): Promise<FmpSearchResult[]> {
  const data = await fmpFetch<FmpSearchResult[]>(
    'search-name',
    `query=${encodeURIComponent(query)}&limit=${limit}`,
  );
  return data ?? [];
}
