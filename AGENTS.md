# Agent Development Contract

This repository uses a **spec-first, test-first, evidence-driven, human-in-the-loop**
workflow. The agent owns the mechanics; **the human owns approval decisions**.
The agent MUST stop at every approval gate and wait for explicit human approval.

## Authority order (if instructions conflict)

`AGENTS.md` > `specs/<feature>/approval.md` gate status > `docs/agent/*` >
skill/procedure details. `approval.md` always wins over `status:` frontmatter
in other artifacts.

## Default lifecycle (detail: `docs/agent/workflow-details.md`)

1. Discover the repo and existing behavior (no production code changes).
2. Create `spec.md` → **STOP at Gate 1** (`Please approve SPEC to continue to PLAN.`)
3. After Gate 1 `APPROVED`, create `plan.md` → **STOP at Gate 2**.
4. After Gate 2 `APPROVED`, create `tasks.md` + `tdd.md` → **STOP at Gate 3**.
5. After Gate 3 `APPROVED`, implement with TDD (RED → GREEN → REFACTOR).
6. Verify per `docs/agent/verification.md`, write `validation.md` with fresh evidence.
7. **STOP at Gate 4.** Only after Gate 4 `APPROVED` may the work be called merge-ready.

Fast-track (trivial only, all must hold: ≤3 files, ≤50 diff lines, no API/schema/
storage-key/dependency/config change): mini-spec (≤15 lines) → straight to Gate 4
with diff + fresh evidence. When in doubt, use the full 4 gates.

## Approval rules (binding)

- Source of truth: `specs/<id>-<slug>/approval.md` with state machine
  `LOCKED → PENDING_APPROVAL → APPROVED`. The agent MUST NOT approve any gate itself.
- Valid approval is ONLY: the human clearly says `approve <spec|plan|tasks|final>`
  for the named gate, or the human directly edits `approval.md` (agent sees the diff).
  If the human approves in chat, the agent may record it in `approval.md` and continue.
- `looks good`, `oke`, silence, or any message without the gate name is AMBIGUOUS —
  ask which gate is approved before proceeding. Never infer approval from confidence.
- The agent MUST NOT: start production implementation before Gate 3 approval,
  silently rewrite an approved artifact and continue, bypass a gate because the
  change seems small (use fast-track explicitly instead), or claim merge-ready
  before Gate 4.
- If requirements change or a material design change is discovered: stop, mark
  affected downstream gates for re-approval in `approval.md` + log, update the
  artifact, return to the relevant gate.

## Artifact layout (`specs/<id>-<slug>/`, templates in `specs/_template/`)

`approval.md` (state) · `spec.md` (requirements + non-goals) · `plan.md` (design +
file impact + risks) · `tasks.md` (AC-linked tasks) · `tdd.md` (RED/GREEN record) ·
`validation.md` (fresh command + AC evidence). Scaffold: `./scripts/new-feature.sh <id> <slug>`.

## Mandatory reading before touching code

1. This file + `docs/agent/context.md` (repo map, stack, canonical commands).
2. `docs/agent/guardrails.md` (verify-before-use, minimal diff, new-surface policy).
3. `docs/agent/conventions.md` (existing patterns to follow).
4. `docs/agent/verification.md` (definition of done) before claiming completion.
5. Nearby code + existing tests for the affected behavior (cite `path:line`).

Key guardrails (detail in `docs/agent/guardrails.md`): cite `path:line`/grep evidence
for every API/file/symbol used — never invent APIs, files, deps, or behavior;
every changed file needs a Why in `plan.md`; new files/deps/config/schema/storage-key
changes require Gate 2 listing; keep `Trade`/`Settings`/storage keys
(`pfx.*.v1`) backward compatible or provide migration.

## Quality bar

- Spec: concrete, testable acceptance criteria + explicit non-goals + discovery evidence.
- Plan/tasks: every task maps to an AC, a file, and a verification command.
- Done: fresh focused tests + full `npx vitest run` + `npx tsc --noEmit` +
  `npm run lint`, every AC mapped to evidence, `git diff --stat` free of
  unrelated files. A green test alone is not proof — AC-to-evidence mapping is.
