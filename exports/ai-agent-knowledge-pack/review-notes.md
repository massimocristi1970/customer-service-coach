# Review Notes

## What I reviewed
- The core agent UI and admin UI to understand how knowledge is searched and maintained.
- The local server behavior to understand how search, logging, unanswered-question capture, and document management work.
- The structured knowledge base itself to determine scope and suitability for an external AI agent.

## Findings relevant to an AI calling agent
- The app is strongly oriented around real support workflows rather than generic FAQ content.
- Document titles are usually phrased as realistic service-desk or call-centre questions, which is useful for intent mapping.
- Keyword metadata is present and should be retained by any downstream vendor because it can be used as synonyms, labels, or retrieval hints.
- The built-in workflow for unanswered questions is valuable and should be mirrored by the external AI provider so new customer intents become future training inputs.
- The content mix suggests a regulated financial-services environment with emphasis on verification, affordability, repayment, vulnerability, fraud, and insolvency topics.

## Recommendation
Use this pack as a retrieval corpus plus taxonomy seed, not as a one-time flat FAQ dump. The highest-value operating model is:
1. Index the structured documents.
2. Keep category and keyword metadata.
3. Log low-confidence and unanswered queries.
4. Add a regular process to feed newly discovered intents back into the knowledge base.
