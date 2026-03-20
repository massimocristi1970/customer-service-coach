# AI Agent Knowledge Pack

This folder contains a downloadable handoff pack for the company operating your AI calling agent.

## Included files
- README.md: this overview.
- ai-agent-vendor-brief.md: a plain-English brief explaining what the knowledge base contains and how to use it.
- review-notes.md: a short assessment of the app as a knowledge source.
- knowledge-base-documents.json: structured export of all knowledge-base records.
- knowledge-base-documents.jsonl: one JSON document per line for ingestion pipelines.
- knowledge-base-documents.csv: flat spreadsheet-friendly export.
- taxonomy-summary.json: category counts and sample titles.

## Suggested handoff
Give the vendor the brief plus one of the structured exports.
- Use JSON if they support nested metadata like keyword arrays.
- Use JSONL if they want one record per line for bulk import.
- Use CSV if they prefer spreadsheet or ETL workflows.

## Notes
- This pack intentionally excludes app configuration, credentials, and local auth details.
- Source material appears operational and finance-related, so production use should still go through your normal compliance review.
