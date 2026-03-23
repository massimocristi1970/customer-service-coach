from __future__ import annotations

import re
import shutil
from pathlib import Path
from typing import Dict, List
import json


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


INTERNAL_TITLE_PATTERNS = [
    r"\bwhat email should i send\b",
    r"\bwhat email do i send\b",
    r"\bwhen do i send\b",
    r"\bwhat details must be entered\b",
    r"\bwhat info do i need\b",
    r"\bwhat stage should i use\b",
    r"\bwhat stage should i move\b",
    r"\bwhen can a customer be rolled back\b",
    r"\bwhen should a customer be moved\b",
    r"\bwhat should i check before saving\b",
    r"\bwho make up\b",
    r"\btexas\b",
    r"\busing idea\b",
    r"\busing carers\b",
    r"\bvulnerabilities & tools for staff\b",
    r"\bcustomer service essentials\b",
    r"\bhandling difficult conversations\b",
    r"\babbreviations log\b",
    r"\boutbound dialling guidelines\b",
    r"\bcall structure\b",
    r"\bdo i need to send\b",
    r"\bcan i confirm the sms code over the phone\b",
    r"\bcan i confirm the email code over the phone\b",
    r"\bcan i stay on the call while\b",
    r"\bhow do i block an account\b",
    r"\bcan i place the customer on a 30 day hold\b",
    r"\bwhat does each stage in the system mean\b",
]


def is_customer_facing_scenario(title: str) -> bool:
    normalized = clean_text(title).lower()
    return not any(re.search(pattern, normalized) for pattern in INTERNAL_TITLE_PATTERNS)


def scenario_question(doc: Dict[str, object]) -> str:
    title = str(doc["title"]).strip()
    if re.match(r"^(what|when|why|how|can|do|is|are)\b", title, re.IGNORECASE):
        return title
    if title.lower().startswith("the customer says"):
        return title
    if "process" in title.lower():
        return f"The customer needs help with {title.lower().replace(' process', '')}."
    if "workflow" in title.lower():
        return f"The customer needs help with {title.lower().replace(' workflow', '')}."
    if title.lower() == "customer portal & login issues":
        return "The customer cannot access their account or is having portal login problems."
    return f"The customer is asking about {title}."


def handling_guidance(doc: Dict[str, object]) -> List[str]:
    category = str(doc["category"])
    title = str(doc["title"]).lower()
    guidance: List[str] = []

    if category in {"customer-portal", "application-processing"}:
        guidance.append("Acknowledge the issue clearly and guide the customer through the practical next steps in plain language.")
    if category in {"payment-plans", "collections-account", "debt-respite", "debt-management"}:
        guidance.append("Explain the process calmly, focus on realistic next steps, and avoid pressuring the customer into unaffordable commitments.")
    if category in {"fraud-disputes", "security-verification"}:
        guidance.append("Do not guess or improvise. Follow the approved process and escalate where identity, fraud, or data rights are involved.")
    if category in {"contact-information"}:
        guidance.append("Give the customer the requested contact details clearly and repeat them if needed.")
    if "vulnerab" in title or "bankrupt" in title or "insolvency" in title or "breathing space" in title or "debt relief" in title:
        guidance.append("Use a supportive tone and make clear what the business can do next without applying unnecessary pressure.")
    if "fraud" in title or "sar" in title or "dsar" in title:
        guidance.append("If the request requires formal verification or evidence, tell the customer what is needed and route to the correct process.")

    if not guidance:
        guidance.append("Answer the question directly, keep the wording clear, and offer the next action the customer should take.")

    return guidance


def escalation_note(doc: Dict[str, object]) -> str:
    title = str(doc["title"]).lower()
    category = str(doc["category"])
    if category in {"fraud-disputes", "security-verification"} or "fraud" in title or "sar" in title or "dsar" in title:
        return "Escalate if identity, fraud evidence, or formal data-rights handling is required."
    if "vulnerab" in title or "bankrupt" in title or "insolvency" in title or "breathing space" in title or "debt relief" in title:
        return "Escalate if the customer is vulnerable, distressed, or their circumstances require specialist handling."
    if category in {"payment-plans", "collections-account", "debt-management"}:
        return "Escalate if the customer asks for an arrangement the AI is not authorised to confirm or if affordability is unclear."
    return "Escalate if the customer asks something outside the approved answer or if the AI is not confident."


EMPLOYEE_PROCESS_PATTERNS = [
    r"You should set .*? via the Accounts tab.*?(?:\.|\n)",
    r"Once the loan has been settled, raise .*?(?:\.|\n)",
    r"raise a .*? task.*?(?:\.|\n)",
    r"record the following information on the system:.*?(?=\n\n|$)",
    r"Record the customer's correct contact details in the system for follow-up\.(?:\n|$)",
    r"Compare these to what[’']s recorded on the account\.(?:\n|$)",
    r"Place the account on hold for 30 days.*?(?=\n\n|$)",
    r"After 30 days.*?fraud investigation\.(?:\n|$)",
    r"If you[’']re uncertain, escalate.*?(?:\n|$)",
    r"escalate to .*?(?:\.|\n)",
    r"follow these steps:.*?(?=\n\n|$)",
    r"Process Overview:?[\s\n]*",
]

INTERNAL_LINE_MARKERS = [
    "when taking the initial details",
    "accounts tab",
    "raise a",
    "raise an",
    "task",
    "on hold",
    "pending evidence",
    "send ",
    "email -",
    "chaser email",
    "vulnerability specialist",
    "assign to",
    "assign the",
    "move the account",
    "move the loan",
    "follow-up",
    "record the",
    "record customer's",
    "record the customer's",
    "on the system",
    "in the system",
    "line manager",
    "review the customer's circumstances",
    "pause collections",
    "hold collections",
    "step 1",
    "step 2",
    "step 3",
    "step 4",
    "trigger event",
    "initial assessment",
    "triggers for referral",
    "family or caregiver involvement",
    "income and expenditure form",
    "customer communication",
    "unreturned income and expenditure",
    "please note",
    "follow-up for",
    "breathing space review",
    "end breathing space",
    "closure",
    "process overview",
]


ANSWER_OVERRIDES = {
    "The customer says the application was made fraudulently and not by them. What should I do?": (
        "If the customer believes the application was fraudulent, they should report it to their bank straight away and ask the bank to investigate. "
        "We may need written confirmation from the bank before the account can be reviewed and any remaining balance or interest can be considered."
    ),
    "Fraud Process": (
        "If the customer says the application or transactions were fraudulent, they should contact their bank immediately and report the matter for investigation. "
        "They may also be asked to report it to Action Fraud or the police and provide written evidence from the bank so the case can be reviewed properly."
    ),
    "Breathing Space Workflow": (
        "If the customer is in financial difficulty or vulnerable, they may be given a temporary breathing-space period while their circumstances are reviewed. "
        "During that time, the business may ask for information about their situation so it can decide what support or next steps are appropriate."
    ),
    "Breathing Space Workflow - Health or Mental Health": (
        "If the customer is affected by physical or mental health issues, bereavement, or serious personal circumstances, they may be considered for additional support or a temporary hold while the business reviews the situation. "
        "The customer may be asked for information or evidence so suitable support can be put in place."
    ),
    "Bankruptcy Procedure": (
        "If the customer has been declared bankrupt or is going through bankruptcy, the account will need to be reviewed under the insolvency process. "
        "The customer may be asked for relevant evidence or reference details so the business can confirm the position and explain what happens next."
    ),
    "Debt Relief Order": (
        "If the customer is under a Debt Relief Order, the account will need to be reviewed in line with that arrangement. "
        "The customer may be asked to provide the relevant details so the business can confirm the order and explain what it means for the account."
    ),
    "Handling Customer DRO Notifications": (
        "If the customer says they are under a Debt Relief Order, the business will need to review the account and confirm the details of the order before explaining the next steps. "
        "The customer may be asked for evidence or reference information to support that review."
    ),
    "DSAR (Data Subject Access Request) Process": (
        "If the customer wants a copy of their personal data, they can make a Data Subject Access Request. "
        "The business may need to verify the request before processing it and will then explain how the information will be provided."
    ),
    "Identifying a Valid SAR": (
        "If the customer is asking for access to their personal data, the business may need to confirm enough detail to understand and verify the request before it can be processed."
    ),
}


def clean_answer_content(content: str) -> str:
    text = clean_text(content)
    for pattern in EMPLOYEE_PROCESS_PATTERNS:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE | re.DOTALL)
    kept_lines: List[str] = []
    for raw_line in text.split("\n"):
        line = raw_line.strip()
        normalized = line.lower()
        if not line:
            if kept_lines and kept_lines[-1] != "":
                kept_lines.append("")
            continue
        if any(marker in normalized for marker in INTERNAL_LINE_MARKERS):
            continue
        kept_lines.append(line)

    cleaned = "\n".join(kept_lines)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = re.sub(r"[ \t]+\n", "\n", cleaned)
    cleaned = cleaned.strip()
    if cleaned.endswith("make sure to"):
        cleaned = ""
    return cleaned


def clean_text(value: str) -> str:
    text = str(value or "")
    if any(marker in text for marker in ["â", "Â", "Ã"]):
        try:
            text = text.encode("latin1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass
    for source, target in MOJIBAKE_REPLACEMENTS.items():
        text = text.replace(source, target)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return "\n".join(line.rstrip() for line in text.split("\n")).strip()


def slugify(text: str) -> str:
    slug = clean_text(text).lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")
    return slug[:120] or "scenario"


def load_documents() -> List[Dict[str, object]]:
    raw = json.loads(SOURCE_PATH.read_text(encoding="utf-8"))
    documents = raw.get("documents", [])
    cleaned: List[Dict[str, object]] = []
    for index, doc in enumerate(documents, start=1):
        category = clean_text(doc.get("category", "uncategorised"))
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
    return [doc for doc in cleaned if is_customer_facing_scenario(str(doc["title"]))]


def reset_output_dir() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for child in OUTPUT_DIR.iterdir():
        if child.is_file():
            child.unlink()
        elif child.is_dir():
            shutil.rmtree(child)


def build_document_text(doc: Dict[str, object]) -> str:
    keywords = doc["keywords"] if doc["keywords"] else []
    answer = ANSWER_OVERRIDES.get(str(doc["title"])) or clean_answer_content(str(doc["content"])) or "[No answer content available]"
    lines = [
        f"Customer Scenario: {scenario_question(doc)}",
        f"Scenario Title: {doc['title']}",
        f"Category: {doc['category_label']}",
        f"Keywords: {', '.join(keywords) if keywords else 'None'}",
        "",
        "Answer To Give The Customer:",
        answer,
    ]
    return "\n".join(lines).strip() + "\n"


def write_scenario_files(documents: List[Dict[str, object]]) -> List[str]:
    written_files: List[str] = []
    used_names = set()

    for doc in documents:
        base_name = f"{int(doc['export_id']):03d}-{slugify(str(doc['title']))}.txt"
        file_name = base_name
        suffix = 2
        while file_name.lower() in used_names:
            file_name = base_name[:-4] + f"-{suffix}.txt"
            suffix += 1
        used_names.add(file_name.lower())

        output_path = OUTPUT_DIR / file_name
        output_path.write_text(build_document_text(doc), encoding="utf-8")
        written_files.append(file_name)

    return written_files


def main() -> None:
    documents = load_documents()
    reset_output_dir()
    written_files = write_scenario_files(documents)
    summary = {
        "document_count": len(documents),
        "output_dir": str(OUTPUT_DIR),
        "files_written": len(written_files),
        "sample_files": written_files[:10],
    }
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
