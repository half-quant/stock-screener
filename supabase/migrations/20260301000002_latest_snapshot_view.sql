-- Materialized view joining latest financials + latest price for each stock.
-- The screener engine queries this view instead of scanning full history tables.
-- Refreshed after each cron data pipeline run.

CREATE MATERIALIZED VIEW latest_stock_snapshot AS
SELECT
    s.id AS stock_id,
    s.ticker,
    s.company_name,
    s.sector,
    s.industry,
    s.market_cap,
    s.exchange,
    -- Financials (latest row per stock)
    f.pe_ratio, f.forward_pe, f.pb_ratio, f.ps_ratio, f.ev_ebitda, f.peg_ratio,
    f.dividend_yield, f.payout_ratio,
    f.roe, f.roa, f.roic,
    f.debt_equity, f.current_ratio, f.interest_coverage,
    f.revenue_growth_yoy, f.revenue_growth_3y, f.eps_growth_yoy,
    f.gross_margin, f.operating_margin, f.net_margin,
    f.next_earnings_date, f.earnings_beat_rate_4q,
    -- Prices (latest row per stock)
    p.price_current, p.price_52w_high, p.price_52w_low,
    p.sma_50, p.sma_200, p.rsi_14, p.relative_strength_sp500,
    p.avg_volume_30d
FROM stocks s
LEFT JOIN LATERAL (
    SELECT * FROM stock_financials
    WHERE stock_id = s.id
    ORDER BY date DESC LIMIT 1
) f ON true
LEFT JOIN LATERAL (
    SELECT * FROM stock_prices
    WHERE stock_id = s.id
    ORDER BY date DESC LIMIT 1
) p ON true
WHERE s.is_active = true;

-- Index the materialized view for screener queries
CREATE UNIQUE INDEX idx_snapshot_stock_id ON latest_stock_snapshot(stock_id);
CREATE INDEX idx_snapshot_ticker ON latest_stock_snapshot(ticker);
CREATE INDEX idx_snapshot_sector ON latest_stock_snapshot(sector);
CREATE INDEX idx_snapshot_market_cap ON latest_stock_snapshot(market_cap);

-- Helper function to refresh the view (called after cron data updates)
CREATE OR REPLACE FUNCTION refresh_stock_snapshot()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY latest_stock_snapshot;
END;
$$ LANGUAGE plpgsql;
