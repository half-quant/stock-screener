CREATE TABLE ai_theses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
    screening_result_id UUID REFERENCES screening_results(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strategy_type TEXT NOT NULL,
    thesis_summary TEXT NOT NULL,
    bull_case JSONB NOT NULL,
    bear_case JSONB NOT NULL,
    catalysts JSONB NOT NULL,
    comparable_companies JSONB NOT NULL,
    confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
    tone TEXT CHECK (tone IN ('conservative', 'moderate', 'aggressive')),
    model_version TEXT NOT NULL,
    financial_snapshot JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);
CREATE INDEX idx_theses_stock_id ON ai_theses(stock_id);
CREATE INDEX idx_theses_user_id ON ai_theses(user_id);
-- Regular composite index for thesis lookups (expiry filtering done at query time)
CREATE INDEX idx_theses_lookup ON ai_theses(stock_id, user_id, strategy_type, tone, expires_at);

CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
    added_from_config_id UUID REFERENCES screener_configs(id) ON DELETE SET NULL,
    notes TEXT,
    alert_on_earnings BOOLEAN DEFAULT TRUE,
    alert_on_price_target DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, stock_id)
);
CREATE INDEX idx_watchlist_user_id ON watchlist_items(user_id);
