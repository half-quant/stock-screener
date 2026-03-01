CREATE TABLE screener_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    strategy_type TEXT CHECK (strategy_type IN ('value', 'growth', 'momentum', 'quality', 'garp', 'custom')),
    filters JSONB NOT NULL,
    sort_by TEXT,
    sort_direction TEXT CHECK (sort_direction IN ('asc', 'desc')),
    universe TEXT CHECK (universe IN ('sp500', 'russell1000', 'russell2000', 'nasdaq100', 'full')),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_configs_user_id ON screener_configs(user_id);

CREATE TABLE screening_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES screener_configs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    results JSONB NOT NULL,
    total_matches INTEGER NOT NULL,
    run_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_results_config_id ON screening_results(config_id);
CREATE INDEX idx_results_user_id ON screening_results(user_id);
