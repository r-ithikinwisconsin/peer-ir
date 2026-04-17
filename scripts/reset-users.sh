#!/usr/bin/env bash
# Wipe synthetic seed data and regenerate test users + cases + votes.
#
# What this does (via scripts/seed.ts):
#   - Deletes every auth user with email @seed.local
#   - Deletes all case_votes, cases, and case_templates
#   - Re-inserts the case templates
#   - Creates NUM_USERS synthetic doctors (Dr. First Last, varied role /
#     setting / years-out-of-training)
#   - Creates NUM_CASES cases with patterned peer votes
#
# Usage:
#   ./scripts/reset-users.sh           # interactive confirm
#   ./scripts/reset-users.sh --yes     # skip confirm (CI/scripted)
#
# If the compose stack is not already running, it is started automatically.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [[ ! -f docker/.env ]]; then
  echo "ERROR: docker/.env not found at $REPO_ROOT/docker/.env" >&2
  exit 1
fi

SKIP_CONFIRM=0
for arg in "$@"; do
  case "$arg" in
    --yes|-y) SKIP_CONFIRM=1 ;;
    -h|--help)
      sed -n '2,16p' "$0"
      exit 0
      ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

DC="docker compose --env-file docker/.env"

echo "This will WIPE all synthetic seed data and regenerate test users."
echo "  • deletes every auth user with email ending @seed.local"
echo "  • deletes all cases + case_votes"
echo "  • re-inserts case templates, users, cases, and votes"
echo

if [[ $SKIP_CONFIRM -eq 0 ]]; then
  read -r -p "Proceed? [y/N] " reply
  case "$reply" in
    y|Y|yes|YES) ;;
    *) echo "Aborted."; exit 0 ;;
  esac
fi

if ! $DC ps --services --status running 2>/dev/null | grep -q '^db$'; then
  echo
  echo "==> Stack not running. Bringing up db + kong + migrator..."
  $DC up -d db auth rest storage kong migrator
  echo "==> Waiting for migrator to finish..."
  $DC wait migrator 2>/dev/null || true
fi

echo
echo "==> Running seed container..."
$DC --profile seed run --rm seed

echo
echo "Done. Sample seeded accounts:"
echo "  email: seed-0@seed.local ... seed-199@seed.local"
echo "  (no passwords needed — use /auth/v1/admin/generate_link for magic links)"
