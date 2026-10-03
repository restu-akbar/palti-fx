---
name: feature-development
description: Run the repository's checkpointed feature workflow from a natural-language task through specification, human approval, plan, human approval, TDD implementation, validation, and final human approval.
---

# Feature Development Skill

Use this skill when the user asks to build, change, fix, or extend product behavior.

Policy: `AGENTS.md` is authoritative. This skill is procedure only.
Details: `docs/agent/workflow-details.md`. Repo map: `docs/agent/context.md`.
Guardrails: `docs/agent/guardrails.md`. Done-criteria: `docs/agent/verification.md`.
Conventions: `docs/agent/conventions.md`.

## Core rule

Treat the task description as the source request, not as permission to start coding.

## Phase 1 — Discover (no production code changes)

- Read `AGENTS.md`, `docs/agent/context.md`, `docs/agent/guardrails.md`,
  `docs/agent/conventions.md`.
- Inspect repo structure, configs, closest existing implementation + tests
  (cite `path:line`). Record discovery evidence for `spec.md`/`plan.md`.
- Run `./scripts/new-feature.sh <id> <slug>` (creates `approval.md` + `spec.md`
  stub; other artifacts stay `LOCKED` placeholders).

## Phase 2 — Specify (Gate 1)

Write `spec.md` from template. Set Gate 1 `PENDING_APPROVAL` in `approval.md`
and STOP: `Please approve SPEC to continue to PLAN.`

## Phase 3 — Plan (Gate 2, only after Gate 1 `APPROVED`)

Write `plan.md` from template (design + file table with Why per file +
data/API/storage-key changes + risks + test strategy + rollout/migration).
Set Gate 2 `PENDING_APPROVAL` and STOP.

## Phase 4 — Tasks + TDD (Gate 3, only after Gate 2 `APPROVED`)

Write `tasks.md` (each task → AC + file + verify command) and `tdd.md`
(RED/GREEN + expected failure + regression coverage). Set Gate 3
`PENDING_APPROVAL` and STOP. Do not touch production code yet.

## Phase 5 — TDD implementation (only after Gate 3 `APPROVED`)

RED (failing test, confirm reason) → GREEN (minimum change) → REFACTOR
(only while green). Reproduce bugs with a regression test first when practical.

## Phase 6 — Verification

Follow `docs/agent/verification.md`. Write `validation.md` with commands +
exit codes + AC-to-evidence mapping + `git diff --stat`. Mark non-runnable
commands `NOT EXECUTED` with reason; never claim PASS without output.

## Phase 7 — Final review (Gate 4)

Re-read `spec.md`, check every AC, inspect final diff, refresh evidence,
document gaps. Set Gate 4 `PENDING_APPROVAL` and STOP:
`Please approve FINAL to consider the work merge-ready.`

## Fast-track (trivial only)

If ALL hold — ≤3 files, ≤50 diff lines, no API/schema/storage-key/dependency/
config change — write a mini-spec (≤15 lines) and go straight to Gate 4 with
diff + fresh evidence. Otherwise use the full 4 gates.

## Approval handling

An approval is valid ONLY as: `approve <spec|plan|tasks|final>` in chat (then
the agent may record it in `approval.md`), or a direct human edit to
`approval.md` visible as a diff. Anything else (`looks good`, `oke`, silence)
is ambiguous — ask which gate is approved. Never self-approve.
