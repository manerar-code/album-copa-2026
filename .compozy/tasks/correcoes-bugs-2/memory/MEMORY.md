# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State

Task 08 (onboarding layout) complete. Remaining tasks: task_05 (selection name truncation).

## Shared Decisions

## Shared Learnings

- Type deduplication in configurableTypes MUST compare by **displayType() label**, not raw type string or case-insensitive match. DB types `'Foil Player'` and `'foil'` both map to `'Brilhante'` via TYPE_DISPLAY, so string-based comparison fails to deduplicate them.

## Open Risks

## Handoffs
