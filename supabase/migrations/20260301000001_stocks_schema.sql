CREATE TABLE stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    sector TEXT,
    industry TEXT,
    market_cap BIGINT,
    exchange TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_stocks_ticker ON stocks(ticker);
CREATE INDEX idx_stocks_sector ON stocks(sector);

-- Fundamental financial data (updated daily via cron)
CREATE TABLE stock_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    -- Valuation
    pe_ratio DECIMAL,
    forward_pe DECIMAL,
    pb_ratio DECIMAL,
    ps_ratio DECIMAL,
    ev_ebitda DECIMAL,
    peg_ratio DECIMAL,
    -- Dividends
    dividend_yield DECIMAL,
    payout_ratio DECIMAL,
    -- Profitability
    roe DECIMAL,
    roa DECIMAL,
    roic DECIMAL,
    -- Balance Sheet
    debt_equity DECIMAL,
    current_ratio DECIMAL,
    interest_coverage DECIMAL,
    -- Growth
    revenue_growth_yoy DECIMAL,
    revenue_growth_3y DECIMAL,
    eps_growth_yoy DECIMAL,
    -- Margins
    gross_margin DECIMAL,
    operating_margin DECIMAL,
    net_margin DECIMAL,
    -- Earnings
    next_earnings_date DATE,
    earnings_beat_rate_4q DECIMAL,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stock_id, date)
);
CREATE INDEX idx_financials_stock_id ON stock_financials(stock_id);
CREATE INDEX idx_financials_date ON stock_financials(date DESC);

-- Price and technical data (updated every 15 min via cron during market hours)
CREATE TABLE stock_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    price_current DECIMAL NOT NULL,
    price_open DECIMAL,
    price_high DECIMAL,
    price_low DECIMAL,
    price_close DECIMAL,
    price_52w_high DECIMAL,
    price_52w_low DECIMAL,
    sma_50 DECIMAL,
    sma_200 DECIMAL,
    rsi_14 DECIMAL,
    relative_strength_sp500 DECIMAL,
    avg_volume_30d BIGINT,
    volume BIGINT,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stock_id, date)
);
CREATE INDEX idx_prices_stock_id ON stock_prices(stock_id);
CREATE INDEX idx_prices_date ON stock_prices(date DESC);
