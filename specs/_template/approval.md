# Human Approval Record

This file is the source of truth for workflow gates. If the `status:` frontmatter
in other artifacts disagrees with this file, **this file wins**.

The AI agent MUST NOT approve gates for itself. An approval is valid ONLY as:
`approve <spec|plan|tasks|final>` in chat (then the agent may record it here),
or a direct human edit to this file visible as a diff.

State machine: `LOCKED → PENDING_APPROVAL → APPROVED`.
- `LOCKED`: phase must not start (previous gate not `APPROVED`).
- `PENDING_APPROVAL`: artifact ready, agent is STOPPED awaiting human decision.
- `APPROVED`: human approved; next phase unlocked. Only a human (chat instruction
  or direct edit) may set this; the agent only records it.

## Gate 1 — Specification

Status: `PENDING_APPROVAL`

Approved by: `HUMAN_ONLY`
Approved at: `YYYY-MM-DD HH:MM TZ`
Notes: `Review spec.md before approval.`

## Gate 2 — Technical Plan

Status: `LOCKED`

Approved by: `HUMAN_ONLY`
Approved at: `YYYY-MM-DD HH:MM TZ`
Notes: `Blocked until Gate 1 is approved.`

## Gate 3 — Tasks + TDD

Status: `LOCKED`

Approved by: `HUMAN_ONLY`
Approved at: `YYYY-MM-DD HH:MM TZ`
Notes: `Blocked until Gate 2 is approved.`

## Gate 4 — Final Validation

Status: `LOCKED`

Approved by: `HUMAN_ONLY`
Approved at: `YYYY-MM-DD HH:MM TZ`
Notes: `Blocked until implementation and validation are complete.`

## Approval log

Append a record whenever a human approves or revokes a gate.

```text
YYYY-MM-DD HH:MM TZ | GATE_1_SPEC | APPROVED/REVOKED | Human note
YYYY-MM-DD HH:MM TZ | GATE_2_PLAN | APPROVED/REVOKED | Human note
YYYY-MM-DD HH:MM TZ | GATE_3_TASKS_TDD | APPROVED/REVOKED | Human note
YYYY-MM-DD HH:MM TZ | GATE_4_FINAL | APPROVED/REVOKED | Human note
```
