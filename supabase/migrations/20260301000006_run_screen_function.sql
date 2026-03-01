-- Postgres function called by the screener API
-- Accepts a JSONB array of filters and returns matching stocks
CREATE OR REPLACE FUNCTION run_screen(
    p_filters JSONB,
    p_logic TEXT DEFAULT 'AND',
    p_universe TEXT DEFAULT 'full',
    p_sort_by TEXT DEFAULT 'market_cap',
    p_sort_dir TEXT DEFAULT 'desc',
    p_limit INTEGER DEFAULT 25,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    stock_id UUID,
    ticker TEXT,
    company_name TEXT,
    sector TEXT,
    market_cap BIGINT,
    matched_metrics JSONB,
    total_count BIGINT
) AS $$
DECLARE
    filter_clause TEXT := '';
    single_filter JSONB;
    connector TEXT;
BEGIN
    -- Build dynamic WHERE clause from filters
    connector := CASE WHEN p_logic = 'OR' THEN ' OR ' ELSE ' AND ' END;

    FOR single_filter IN SELECT * FROM jsonb_array_elements(p_filters)
    LOOP
        IF filter_clause != '' THEN
            filter_clause := filter_clause || connector;
        END IF;

        filter_clause := filter_clause || format(
            '%I %s %s',
            single_filter->>'metric',
            CASE (single_filter->>'operator')
                WHEN 'gt' THEN '>'
                WHEN 'gte' THEN '>='
                WHEN 'lt' THEN '<'
                WHEN 'lte' THEN '<='
                WHEN 'eq' THEN '='
                WHEN 'between' THEN 'BETWEEN'
            END,
            CASE (single_filter->>'operator')
                WHEN 'between' THEN
                    (single_filter->>'value') || ' AND ' || (single_filter->>'value2')
                ELSE
                    (single_filter->>'value')
            END
        );
    END LOOP;

    RETURN QUERY EXECUTE format(
        'SELECT stock_id, ticker, company_name, sector, market_cap,
                to_jsonb(lss) AS matched_metrics,
                COUNT(*) OVER() AS total_count
         FROM latest_stock_snapshot lss
         WHERE (%s)
         ORDER BY %I %s
         LIMIT %s OFFSET %s',
        filter_clause, p_sort_by, p_sort_dir, p_limit, p_offset
    );
END;
$$ LANGUAGE plpgsql STABLE;
