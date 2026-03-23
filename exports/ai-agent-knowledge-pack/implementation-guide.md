# Implementation Guide

## How to use this pack
- Index the exported documents as a retrieval corpus.
- Keep `category`, `category_label`, `keywords`, and `last_updated` in the vendor index.
- Use the document `content` field as the primary answer body.
- Present concise answers first, then offer next-step guidance or escalation routes.

## Change management
- Treat the exported files as a versioned snapshot, not a live source of truth.
- Record the export date in the vendor environment so the team knows how current the corpus is.
- Any content change request should be reviewed internally first and then released by sending a fresh export.
- Do not let the vendor edit the source of truth directly if API or database access is intentionally restricted.

## QA checklist
- Verify that top results stay within the correct category for common intents.
- Verify that answers remain procedural and do not invent policy where no document exists.
- Verify that low-confidence intents route to a human or fallback path.
- Verify that keyword metadata improves retrieval rather than being shown verbatim to customers.

## Sample validation queries
- Query: The customer says their e-sign link is not working.
  Expected category: application-processing
  Expected outcome: Return the e-sign troubleshooting steps and advise escalation with screenshot if the issue persists.
- Query: The customer wants to know how Breathing Space affects interest.
  Expected category: debt-respite
  Expected outcome: Return the breathing-space process answer and keep wording procedural rather than speculative.
- Query: The customer says the application was fraudulent.
  Expected category: fraud-disputes
  Expected outcome: Route to the fraud process rather than trying to resolve casually in-line.
- Query: The customer cannot log in after resetting their password.
  Expected category: customer-portal
  Expected outcome: Return the login troubleshooting answer and mention exact-field matching for email and surname where relevant.
- Query: The customer asks what details are needed for a new payment plan.
  Expected category: payment-plans
  Expected outcome: Return the payment-plan setup fields clearly and in list form.