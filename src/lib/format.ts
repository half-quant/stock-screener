const NA = "N/A";

/**
 * Format a number as USD currency.
 * Returns "N/A" for null/undefined values.
 * Default: 2 decimal places.
 */
export function formatCurrency(
  value: number | null | undefined,
  opts?: { decimals?: number }
): string {
  if (value == null) return NA;

  const decimals = opts?.decimals ?? 2;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a number with locale-aware separators.
 * Returns "N/A" for null/undefined values.
 * Default: 2 decimal places.
 */
export function formatNumber(
  value: number | null | undefined,
  opts?: { decimals?: number }
): string {
  if (value == null) return NA;

  const decimals = opts?.decimals ?? 2;

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a number as a percentage.
 * Returns "N/A" for null/undefined values.
 * Default: 1 decimal place.
 * Input is treated as a raw number (e.g., 12.3 becomes "12.3%").
 */
export function formatPercent(
  value: number | null | undefined,
  opts?: { decimals?: number }
): string {
  if (value == null) return NA;

  const decimals = opts?.decimals ?? 1;

  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)}%`;
}

/**
 * Format a large number into a human-readable abbreviated form.
 * Returns "N/A" for null/undefined values.
 *
 * Examples: 1_200_000_000_000 -> "1.2T", 345_000_000 -> "345.0M", 12_000 -> "12.0K"
 */
export function formatLargeNumber(
  value: number | null | undefined
): string {
  if (value == null) return NA;

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1_000_000_000_000) {
    return `${sign}${(abs / 1_000_000_000_000).toFixed(1)}T`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(1)}K`;
  }

  return `${sign}${abs.toFixed(1)}`;
}

type MarketCapCategory = "Mega Cap" | "Large Cap" | "Mid Cap" | "Small Cap" | "Micro Cap";

/**
 * Format a market cap value with its category label.
 * Returns "N/A" for null/undefined values.
 *
 * Categories:
 *  - Mega Cap: > $200B
 *  - Large Cap: $10B - $200B
 *  - Mid Cap: $2B - $10B
 *  - Small Cap: $300M - $2B
 *  - Micro Cap: < $300M
 */
export function formatMarketCap(
  value: number | null | undefined
): string {
  if (value == null) return NA;

  const abbreviated = formatLargeNumber(value);
  const category = getMarketCapCategory(value);

  return `${category} ($${abbreviated.replace("-", "")})`;
}

function getMarketCapCategory(value: number): MarketCapCategory {
  const abs = Math.abs(value);

  if (abs > 200_000_000_000) return "Mega Cap";
  if (abs >= 10_000_000_000) return "Large Cap";
  if (abs >= 2_000_000_000) return "Mid Cap";
  if (abs >= 300_000_000) return "Small Cap";
  return "Micro Cap";
}

/**
 * Format a date as a short human-readable string.
 * Returns "N/A" for null/undefined values.
 *
 * Example: "Mar 1, 2026"
 */
export function formatDate(
  date: string | Date | null | undefined
): string {
  if (date == null) return NA;

  const parsed = typeof date === "string" ? new Date(date) : date;

  if (isNaN(parsed.getTime())) return NA;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago").
 * Returns "N/A" for null/undefined values.
 */
export function formatRelativeDate(
  date: string | Date | null | undefined
): string {
  if (date == null) return NA;

  const parsed = typeof date === "string" ? new Date(date) : date;

  if (isNaN(parsed.getTime())) return NA;

  const now = Date.now();
  const diffMs = now - parsed.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 0) return "just now";
  if (diffSeconds < 60) return "just now";
  if (diffMinutes === 1) return "1 minute ago";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return "1 week ago";
  if (diffWeeks < 5) return `${diffWeeks} weeks ago`;
  if (diffMonths === 1) return "1 month ago";
  if (diffMonths < 12) return `${diffMonths} months ago`;
  if (diffYears === 1) return "1 year ago";
  return `${diffYears} years ago`;
}
