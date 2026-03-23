from __future__ import annotations

import csv
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List


ROOT = Path(__file__).resolve().parent
SOURCE_PATH = ROOT / "knowledge-base.json"
OUTPUT_DIR = ROOT / "exports" / "ai-agent-knowledge-pack"


MOJIBAKE_REPLACEMENTS = {
    "â€¢": "-",
    "â€”": "-",
    "â€“": "-",
    "â€™": "'",
    "â€˜": "'",
    'â€œ': '"',
    'â€\x9d': '"',
    "Â£": "GBP ",
    "\u00a0": " ",
}


CATEGORY_LABELS = {
    "application-processing": "Application Processing & General Operations",
    "collections-account": "Collections & Account Status Management",
    "payment-plans": "Payment Plans & Scheduling",
    "customer-portal": "Customer Portal & Login Issues",
    "security-verification": "Security, Verification & Data Requests",
    "debt-respite": "Debt Respite Scheme / Breathing Space",
    "income-evidence": "Income Evidence & Verification",
    "transaction-responses": "Transaction Responses & Payment Issues",
    "right-to-withdraw": "Right to Withdraw (RTW)",
    "fraud-disputes": "Fraud & Disputes",
    "debt-management": "Debt Management Companies (DMC)",
    "system-email": "System Stages & Email Management",
    "contact-information": "Contact Information",
}


def clean_text(value: str) -> str:
    text = str(value or "")
    if any(marker in text for marker in ["â", "Â", "Ã"]):
        try:
            repaired = text.encode("latin1").decode("utf-8")
            text = repaired
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass
    for source, target in MOJIBAKE_REPLACEMENTS.items():
        text = text.replace(source, target)
    return "\n".join(line.rstrip() for line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n")).strip()


def load_documents() -> List[Dict[str, object]]:
    raw = json.loads(SOURCE_PATH.read_text(encoding="utf-8"))
    documents = raw.get("documents", [])
    cleaned: List[Dict[str, object]] = []
    for index, doc in enumerate(documents, start=1):
        category = doc.get("category", "uncategorised")
        cleaned.append(
            {
                "export_id": index,
                "id": doc.get("id"),
                "title": clean_text(doc.get("title", "")),
                "category": category,
                "category_label": CATEGORY_LABELS.get(category, category.replace("-", " ").title()),
                "section": clean_text(doc.get("section", "")),
                "source": clean_text(doc.get("source", "")),
                "keywords": [clean_text(keyword) for keyword in doc.get("keywords", []) if clean_text(keyword)],
                "content": clean_text(doc.get("content", "")),
                "last_updated": clean_text(doc.get("lastUpdated", "")),
            }
        )
    return cleaned


def build_taxonomy_summary(documents: List[Dict[str, object]]) -> Dict[str, object]:
    counts = Counter(doc["category"] for doc in documents)
    categories = []
    for category, count in sorted(counts.items(), key=lambda item: (-item[1], item[0])):
        sample_titles = [doc["title"] for doc in documents if doc["category"] == category][:5]
        categories.append(
            {
                "category": category,
                "label": CATEGORY_LABELS.get(category, category.replace("-", " ").title()),
                "count": count,
                "sample_titles": sample_titles,
            }
        )
    return {
        "total_documents": len(documents),
        "categories": categories,
    }


def build_test_queries() -> List[Dict[str, str]]:
    return [
        {
            "query": "The customer says their e-sign link is not working.",
            "expected_category": "application-processing",
            "expected_outcome": "Return the e-sign troubleshooting steps and advise escalation with screenshot if the issue persists.",
        },
        {
            "query": "The customer wants to know how Breathing Space affects interest.",
            "expected_category": "debt-respite",
            "expected_outcome": "Return the breathing-space process answer and keep wording procedural rather than speculative.",
        },
        {
            "query": "The customer says the application was fraudulent.",
            "expected_category": "fraud-disputes",
            "expected_outcome": "Route to the fraud process rather than trying to resolve casually in-line.",
        },
        {
            "query": "The customer cannot log in after resetting their password.",
            "expected_category": "customer-portal",
            "expected_outcome": "Return the login troubleshooting answer and mention exact-field matching for email and surname where relevant.",
        },
        {
            "query": "The customer asks what details are needed for a new payment plan.",
            "expected_category": "payment-plans",
            "expected_outcome": "Return the payment-plan setup fields clearly and in list form.",
        },
    ]


def build_manifest(documents: List[Dict[str, object]]) -> Dict[str, object]:
    generated_at = datetime.now(timezone.utc).isoformat()
    return {
        "generated_at": generated_at,
        "pack_version": "2.0",
        "source_repo": "customer-service-coach",
        "package_name": "ai-agent-knowledge-pack",
        "document_count": len(documents),
        "offline_handoff_only": True,
        "contains_full_answer_content": True,
        "files": [
            "README.md",
            "ai-agent-vendor-brief.md",
            "implementation-guide.md",
            "review-notes.md",
            "knowledge-base-detailed.txt",
            "knowledge-base-documents.json",
            "knowledge-base-documents.jsonl",
            "knowledge-base-documents.csv",
            "taxonomy-summary.json",
            "manifest.json",
        ],
    }


def write_json_documents(documents: List[Dict[str, object]]) -> None:
    path = OUTPUT_DIR / "knowledge-base-documents.json"
    path.write_text(json.dumps(documents, indent=2, ensure_ascii=False), encoding="utf-8")


def write_jsonl_documents(documents: List[Dict[str, object]]) -> None:
    path = OUTPUT_DIR / "knowledge-base-documents.jsonl"
    lines = [json.dumps(doc, ensure_ascii=False) for doc in documents]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_csv_documents(documents: List[Dict[str, object]]) -> None:
    path = OUTPUT_DIR / "knowledge-base-documents.csv"
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "export_id",
                "id",
                "title",
                "category",
                "category_label",
                "section",
                "source",
                "keywords",
                "content",
                "last_updated",
            ],
        )
        writer.writeheader()
        for doc in documents:
            writer.writerow(
                {
                    **doc,
                    "keywords": " | ".join(doc["keywords"]),
                }
            )


def write_detailed_text_export(documents: List[Dict[str, object]]) -> None:
    path = OUTPUT_DIR / "knowledge-base-detailed.txt"
    lines = [
        "Customer Service Coach Knowledge Base",
        "Detailed Offline Export",
        "",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        f"Document count: {len(documents)}",
        "",
        "This file is intended for vendor knowledge-base upload or review.",
        "It contains the full answer content for every exported document.",
        "",
    ]
    for doc in documents:
        lines.extend(
            [
                "=" * 80,
                f"Document ID: {doc['id']}",
                f"Export ID: {doc['export_id']}",
                f"Title: {doc['title']}",
                f"Category: {doc['category_label']} ({doc['category']})",
                f"Section: {doc['section']}",
                f"Source: {doc['source']}",
                f"Last Updated: {doc['last_updated']}",
                f"Keywords: {', '.join(doc['keywords']) if doc['keywords'] else 'None'}",
                "",
                "Answer Content:",
                doc["content"] or "[No content]",
                "",
            ]
        )
    path.write_text("\n".join(lines), encoding="utf-8")


def write_readme(manifest: Dict[str, object]) -> None:
    path = OUTPUT_DIR / "README.md"
    lines = [
        "# AI Agent Knowledge Pack",
        "",
        "This folder contains an offline handoff pack for the company operating your AI calling agent.",
        "",
        "## What this pack gives the vendor",
        "- The full exported knowledge-base content, including the answer text for each document.",
        "- Category and keyword metadata to support routing, retrieval, and confidence scoring.",
        "- A handoff brief, implementation guide, review notes, and taxonomy summary.",
        "",
        "## What this pack does not give the vendor",
        "- Live API or database access.",
        "- Automatic visibility of future edits after this export date.",
        "- Application credentials, admin settings, or local auth details.",
        "",
        "## Included files",
    ]
    for file_name in manifest["files"]:
        lines.append(f"- {file_name}")
    lines.extend(
        [
            "",
            "## Suggested handoff",
            "- Give the vendor the brief plus JSON if they support structured ingestion.",
            "- Use JSONL if they want one document per line for bulk import pipelines.",
            "- Use CSV if they prefer spreadsheet review or ETL workflows.",
            "",
            "## Operating note",
            "- Because this is an offline pack, any future content changes need a refreshed export and resend.",
        ]
    )
    path.write_text("\n".join(lines), encoding="utf-8")


def write_vendor_brief(manifest: Dict[str, object], taxonomy_summary: Dict[str, object]) -> None:
    path = OUTPUT_DIR / "ai-agent-vendor-brief.md"
    lines = [
        "# AI Agent Knowledge Handoff Pack",
        "",
        "## Purpose",
        "This pack is designed for a third-party AI calling agent provider. It captures the operational knowledge currently stored in the SavvyConnect / Customer Service Coach app so their AI can answer customer-service questions more accurately and in language that matches your internal processes.",
        "",
        "## What this app contains",
        f"- A searchable operational knowledge base used by front-line agents during live customer conversations.",
        f"- {manifest['document_count']} curated documents stored in a structured format.",
        "- Full answer content for each exported document, not just titles or metadata.",
        "- Content that is mostly written as real agent questions and procedural answers, which makes it suitable for intent matching and retrieval-augmented answering.",
        "- An admin workflow for adding new content, refining keywords, and reviewing unanswered questions.",
        "",
        "## Access boundary",
        "- This handoff does not require API access to the live database.",
        "- The vendor can read and index the answer content directly from the exported JSON, JSONL, or CSV files.",
        "- The vendor will not see future edits unless you provide a refreshed export.",
        "",
        "## What the knowledge appears to cover",
    ]
    for category in taxonomy_summary["categories"]:
        lines.append(f"- {category['label']}: {category['count']} documents")
    lines.extend(
        [
            "",
            "## Recommended use by the AI vendor",
            "- Treat each document as procedural guidance, not just factual snippets.",
            "- Preserve category and keyword metadata because it improves routing and confidence.",
            "- Prefer retrieval over pure generation for regulated or process-heavy answers.",
            "- Return short actionable answers first, then offer clarifying next steps.",
            "- Where confidence is low or no clear matching document exists, the AI should explicitly say it is unsure and route to a human or approved fallback process.",
            "- Keep an audit trail of unanswered or low-confidence intents so the pack can be expanded over time.",
            "",
            "## Important cautions",
            "- This repository also contains application configuration and internal access controls. Those are not included in this handoff pack because they are not needed for answer quality and may expose unnecessary internal details.",
            "- Some content appears to be specific to Tick Tock Loans / Tick Tock Advance and should be validated before being surfaced externally word-for-word.",
            "- This pack should be treated as operational guidance and reviewed for compliance before the vendor uses it in production.",
        ]
    )
    path.write_text("\n".join(lines), encoding="utf-8")


def write_implementation_guide(test_queries: List[Dict[str, str]]) -> None:
    path = OUTPUT_DIR / "implementation-guide.md"
    lines = [
        "# Implementation Guide",
        "",
        "## How to use this pack",
        "- Index the exported documents as a retrieval corpus.",
        "- Keep `category`, `category_label`, `keywords`, and `last_updated` in the vendor index.",
        "- Use the document `content` field as the primary answer body.",
        "- Present concise answers first, then offer next-step guidance or escalation routes.",
        "",
        "## Change management",
        "- Treat the exported files as a versioned snapshot, not a live source of truth.",
        "- Record the export date in the vendor environment so the team knows how current the corpus is.",
        "- Any content change request should be reviewed internally first and then released by sending a fresh export.",
        "- Do not let the vendor edit the source of truth directly if API or database access is intentionally restricted.",
        "",
        "## QA checklist",
        "- Verify that top results stay within the correct category for common intents.",
        "- Verify that answers remain procedural and do not invent policy where no document exists.",
        "- Verify that low-confidence intents route to a human or fallback path.",
        "- Verify that keyword metadata improves retrieval rather than being shown verbatim to customers.",
        "",
        "## Sample validation queries",
    ]
    for item in test_queries:
        lines.append(f"- Query: {item['query']}")
        lines.append(f"  Expected category: {item['expected_category']}")
        lines.append(f"  Expected outcome: {item['expected_outcome']}")
    path.write_text("\n".join(lines), encoding="utf-8")


def write_review_notes() -> None:
    path = OUTPUT_DIR / "review-notes.md"
    lines = [
        "# Review Notes",
        "",
        "## What I reviewed",
        "- The structured knowledge base itself to determine scope and suitability for an external AI agent.",
        "- The exported fields available for offline handoff.",
        "- The likely handoff needs of a vendor that will not receive live API or database access.",
        "",
        "## Findings relevant to an AI calling agent",
        "- The app is strongly oriented around real support workflows rather than generic FAQ content.",
        "- Document titles are usually phrased as realistic service-desk or call-centre questions, which is useful for intent mapping.",
        "- Keyword metadata is present and should be retained by any downstream vendor because it can be used as synonyms, labels, or retrieval hints.",
        "- The export includes the full answer content for each document, so the vendor can work without direct database access.",
        "- Because the delivery model is offline, the main operational risk is stale content rather than missing content.",
        "",
        "## Recommendation",
        "Use this pack as a retrieval corpus plus taxonomy seed, not as a one-time flat FAQ dump. The highest-value operating model is:",
        "1. Index the structured documents.",
        "2. Keep category and keyword metadata.",
        "3. Log low-confidence and unanswered queries.",
        "4. Refresh and resend the export whenever material content changes are approved.",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")


def write_taxonomy_summary(taxonomy_summary: Dict[str, object]) -> None:
    path = OUTPUT_DIR / "taxonomy-summary.json"
    path.write_text(json.dumps(taxonomy_summary, indent=2, ensure_ascii=False), encoding="utf-8")


def write_manifest(manifest: Dict[str, object]) -> None:
    path = OUTPUT_DIR / "manifest.json"
    path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    documents = load_documents()
    taxonomy_summary = build_taxonomy_summary(documents)
    test_queries = build_test_queries()
    manifest = build_manifest(documents)
    write_json_documents(documents)
    write_jsonl_documents(documents)
    write_csv_documents(documents)
    write_detailed_text_export(documents)
    write_readme(manifest)
    write_vendor_brief(manifest, taxonomy_summary)
    write_implementation_guide(test_queries)
    write_review_notes()
    write_taxonomy_summary(taxonomy_summary)
    write_manifest(manifest)
    print(json.dumps({"document_count": len(documents), "output_dir": str(OUTPUT_DIR)}, indent=2))


if __name__ == "__main__":
    main()
