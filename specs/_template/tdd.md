---
status: PENDING_APPROVAL
---

# TDD Record

> Gate status lives in `approval.md` (source of truth). This frontmatter mirrors it.
> This artifact may only be created/updated after Gate 2 approval and must be
> human-approved at Gate 3 before implementation begins.

For each behavior, record the RED → GREEN → REFACTOR cycle.

## Behavior: <name> (covers AC<x>)

### RED
- Test: ...
- Command: `...`
- Expected failure reason: ...
- Observed result: ...

### GREEN
- Minimal implementation: ...
- Command: `...`
- Observed result: ...

### REFACTOR
- Refactor performed: ...
- Command: `...`
- Observed result: ...

## Regression Coverage

| Existing test | Result before | Result after | Notes |
|---|---|---|---|
| `tests/<area>.test.ts` | ... | ... | ... |

For bugs: attach the reproduction test before the fix whenever practical.
