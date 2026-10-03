---
status: PENDING_APPROVAL
---

# Implementation Tasks

> Gate status lives in `approval.md` (source of truth). This frontmatter mirrors it.
> This artifact may only be created/updated after Gate 2 approval.

## Prerequisites

- [ ] Read and understand `spec.md` and `plan.md`.

## Tasks (every row needs AC + file + verify command)

| ID | Acceptance criterion | File(s) | Verification command |
|---|---|---|---|
| T1 | AC1 | `...` | `npx vitest run tests/<area>.test.ts` |
| T2 | AC2 + edge cases | `...` | `...` |
| T3 | Regression (existing tests) | `...` | `npx vitest run` |

Rules: a task without an AC link is rejected at Gate 3. A task without an
explicit verification command is rejected at Gate 3.

## Final Verification

- [ ] V1: Focused tests (`npx vitest run tests/<area>.test.ts`).
- [ ] V2: Full suite (`npx vitest run`).
- [ ] V3: Typecheck (`npx tsc --noEmit`) + lint (`npm run lint`).
- [ ] V4: Build/export only if config or cross-platform shell touched.
- [ ] V5: Every acceptance criterion mapped to fresh evidence in `validation.md`.
