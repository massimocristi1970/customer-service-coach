# AI Agent Knowledge Handoff Pack

## Purpose
This pack is designed for a third-party AI calling agent provider. It captures the operational knowledge currently stored in the SavvyConnect / Customer Service Coach app so their AI can answer customer-service questions more accurately and in language that matches your internal processes.

## What this app contains
- A searchable operational knowledge base used by front-line agents during live customer conversations.
- 92 curated documents stored in a structured format.
- Full answer content for each exported document, not just titles or metadata.
- Content that is mostly written as real agent questions and procedural answers, which makes it suitable for intent matching and retrieval-augmented answering.
- An admin workflow for adding new content, refining keywords, and reviewing unanswered questions.

## Access boundary
- This handoff does not require API access to the live database.
- The vendor can read and index the answer content directly from the exported JSON, JSONL, or CSV files.
- The vendor will not see future edits unless you provide a refreshed export.

## What the knowledge appears to cover
- Application Processing & General Operations: 42 documents
- Collections & Account Status Management: 10 documents
- Payment Plans & Scheduling: 7 documents
- Customer Portal & Login Issues: 5 documents
- Debt Respite Scheme / Breathing Space: 5 documents
- Security, Verification & Data Requests: 5 documents
- Income Evidence & Verification: 4 documents
- Transaction Responses & Payment Issues: 4 documents
- Contact Information: 2 documents
- Debt Management Companies (DMC): 2 documents
- Fraud & Disputes: 2 documents
- Right to Withdraw (RTW): 2 documents
- System Stages & Email Management: 2 documents

## Recommended use by the AI vendor
- Treat each document as procedural guidance, not just factual snippets.
- Preserve category and keyword metadata because it improves routing and confidence.
- Prefer retrieval over pure generation for regulated or process-heavy answers.
- Return short actionable answers first, then offer clarifying next steps.
- Where confidence is low or no clear matching document exists, the AI should explicitly say it is unsure and route to a human or approved fallback process.
- Keep an audit trail of unanswered or low-confidence intents so the pack can be expanded over time.

## Important cautions
- This repository also contains application configuration and internal access controls. Those are not included in this handoff pack because they are not needed for answer quality and may expose unnecessary internal details.
- Some content appears to be specific to Tick Tock Loans / Tick Tock Advance and should be validated before being surfaced externally word-for-word.
- This pack should be treated as operational guidance and reviewed for compliance before the vendor uses it in production.