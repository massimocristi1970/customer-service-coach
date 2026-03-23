# AI Agent Knowledge Pack

This folder contains an offline handoff pack for the company operating your AI calling agent.

## What this pack gives the vendor
- The full exported knowledge-base content, including the answer text for each document.
- Category and keyword metadata to support routing, retrieval, and confidence scoring.
- A handoff brief, implementation guide, review notes, and taxonomy summary.

## What this pack does not give the vendor
- Live API or database access.
- Automatic visibility of future edits after this export date.
- Application credentials, admin settings, or local auth details.

## Included files
- README.md
- ai-agent-vendor-brief.md
- implementation-guide.md
- review-notes.md
- knowledge-base-documents.json
- knowledge-base-documents.jsonl
- knowledge-base-documents.csv
- taxonomy-summary.json
- manifest.json

## Suggested handoff
- Give the vendor the brief plus JSON if they support structured ingestion.
- Use JSONL if they want one document per line for bulk import pipelines.
- Use CSV if they prefer spreadsheet review or ETL workflows.

## Operating note
- Because this is an offline pack, any future content changes need a refreshed export and resend.