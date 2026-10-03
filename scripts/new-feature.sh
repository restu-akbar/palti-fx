#!/usr/bin/env bash
set -euo pipefail

ID="${1:?usage: ./scripts/new-feature.sh <id> <slug>}"
SLUG="${2:?usage: ./scripts/new-feature.sh <id> <slug>}"
ROOT="specs/${ID}-${SLUG}"

if [[ ! "$ID" =~ ^[0-9]{3}$ ]]; then
  echo "ID must be 3 digits (e.g. 042)" >&2
  exit 1
fi
if [[ ! "$SLUG" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Slug must be kebab-case (e.g. password-reset)" >&2
  exit 1
fi

if [[ -e "$ROOT" ]]; then
  echo "Feature directory already exists: $ROOT" >&2
  exit 1
fi

mkdir -p "$ROOT"
cp specs/_template/approval.md "$ROOT/approval.md"
cp specs/_template/spec.md "$ROOT/spec.md"

# Planning/implementation artifacts are intentionally not created yet.
# They are unlocked only after their respective human approval gates.
# Create LOCKED placeholders so agents cannot invent them prematurely.
for f in plan tasks tdd validation; do
  {
    echo "---"
    echo "status: LOCKED"
    echo "---"
    echo ""
    echo "# ${f^} (LOCKED)"
    echo ""
    echo "Blocked until the preceding gate is APPROVED in approval.md."
    echo "See specs/_template/${f}.md when unlocked."
  } > "$ROOT/${f}.md"
done

echo "Created $ROOT"
echo "Gate 1 is PENDING_APPROVAL. Review $ROOT/spec.md then approve Gate 1 before continuing."
