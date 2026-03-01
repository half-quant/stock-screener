-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE screener_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_theses ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;

-- users: Read own profile
CREATE POLICY "Users view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- stocks, financials, prices (publicly readable)
CREATE POLICY "Public stocks read" ON stocks FOR SELECT USING (true);
CREATE POLICY "Public financials read" ON stock_financials FOR SELECT USING (true);
CREATE POLICY "Public prices read" ON stock_prices FOR SELECT USING (true);

-- screener_configs
CREATE POLICY "Users manage own configs" ON screener_configs USING (auth.uid() = user_id);
CREATE POLICY "Public configs readable" ON screener_configs FOR SELECT USING (is_public = true);

-- screening_results, ai_theses, watchlist (user isolated)
CREATE POLICY "Users manage own results" ON screening_results USING (auth.uid() = user_id);
CREATE POLICY "Users manage own theses" ON ai_theses USING (auth.uid() = user_id);
CREATE POLICY "Users manage own watchlist" ON watchlist_items USING (auth.uid() = user_id);
