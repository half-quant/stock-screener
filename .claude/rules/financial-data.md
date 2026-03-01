# Financial Data Rules
- Never hardcode financial data — always fetch from database
- All financial metrics must have a source attribution (FMP, calculated, etc.)
- When a metric is unavailable, display "N/A" not 0 or blank
- P/E ratios: negative means company is unprofitable, display as "N/A (negative earnings)"
- Growth rates: always specify the time period (YoY, 3Y CAGR, 5Y CAGR)
- Market cap categories: Mega (>200B), Large (10-200B), Mid (2-10B), Small (300M-2B), Micro (<300M)
- All screening comparisons use the LATEST available data point per stock
- Never mix quarterly and annual data in the same comparison