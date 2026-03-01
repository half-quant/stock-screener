# AI Thesis Generation Rules
- Every thesis prompt must include the EXACT financial data being referenced
- Store the financial snapshot with every generated thesis for auditability
- Never let the AI hallucinate numbers — if data is missing, exclude that metric
- Thesis generation is a POST request, never GET (it creates a resource)
- Cache theses for 7 days — financial data changes but not daily for fundamentals
- Always include model_version in the ai_theses record
- Rate limit thesis generation: free users get 20/day, pro users get 200/day
- Batch thesis generation must be queued, not blocking — use streaming for UX