---
name: uchicode-deploy-safety
description: Apply Uchicode production deployment, VPS, Docker Compose, migration, backup, health-check, smoke-test, rollback, and state-documentation safeguards. Use only for explicitly requested deploy or production operations.
---

# Uchicode Deploy Safety

Use `DEPLOY.md` and `deploy/docs/README.md` as the canonical runbooks. Verify the local commit, remote `main`, actual VPS state, and requested deployment scope before operating.

## Non-Negotiable Rules

- Require an explicit deploy/production request.
- Back up before pull, migration, build, or restart; record the backup path.
- Never run `docker compose down -v`, delete volumes, or rewrite Git history.
- Never edit secrets or production env unless the user explicitly requests a separately reviewed change.
- Never install Piston or execute user C++ on the production VPS.
- Confirm `CHECKER_EXECUTION_ENABLED=false` unless an explicitly approved release changes it.

## Controlled Deployment

1. Require clean local and VPS trees; record previous and target hashes.
2. Create and verify a backup before changing the checkout.
3. Pull by fast-forward and apply migrations according to the runbook.
4. Build and start with the production Compose project without deleting data.
5. Verify container state and health, including `/nginx-health` and `/api/health`.
6. Smoke-test affected routes and inspect relevant logs without printing secrets.
7. Keep a concrete rollback hash and procedure ready; stop on failed health or migration checks.

## State Reporting

Report previous/new production hashes, backup path, migrations, containers, health, smoke results, and rollback status. A docs-only state commit after a successful deploy may be pushed without redeploying unless the repository automation says otherwise.
