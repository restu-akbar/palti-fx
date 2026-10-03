---
status: PENDING_APPROVAL
---

# Validation Evidence

> Gate status lives in `approval.md` (source of truth). This frontmatter mirrors it.
> Created/updated during final verification; human-approved at Gate 4.
> Evidence must be fresh (after the final diff). See `docs/agent/verification.md`.

## Commands Run (exact command + exit code + output summary)

| Check | Command | Exit | Result | Evidence |
|---|---|---|---|---|
| Focused tests | `npx vitest run tests/<area>.test.ts` | 0/... | PASS/FAIL | ... |
| Full suite | `npx vitest run` | 0/... | PASS/FAIL | ... |
| Typecheck | `npx tsc --noEmit` | 0/... | PASS/FAIL | ... |
| Lint | `npm run lint` | 0/... | PASS/FAIL | ... |
| Build / export | `...` or N/A + reason | ... | PASS/FAIL/N/A | ... |

Non-runnable commands: mark `NOT EXECUTED` + reason. Never claim PASS without output.

## Acceptance Criteria

| Criterion | Evidence (test name / command output) | Status |
|---|---|---|
| AC1 | ... | PASS/FAIL |
| AC2 | ... | PASS/FAIL |

Every AC needs at least one evidence row. AC without evidence = FAIL.

## Diff Hygiene

- `git status --short`: ...
- `git diff --stat`: ...
- Unexpected files: none / list + reason.

## Remaining Gaps

- ...
