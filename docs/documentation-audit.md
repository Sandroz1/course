# Documentation Audit

Актуально на 2026-06-10. Это краткая заметка по docs cleanup, не отдельный runbook.

## Checked

- Root docs: `README.md`, `AGENTS.md`, `PROJECT_STATUS.md`, `LOCAL_RUNBOOK.md`, `DEPLOY.md`, `DEPLOY_SSL.md`, `SMOKE_TESTS.md`.
- Main docs: all markdown files in `docs`.
- Production docs: `deploy/README.md` and `deploy/docs/*.md`.
- Supporting README files: `practice/README.md`, `site/src/styles/README.md`.

## Findings

- Root `README.md` duplicated local run, deploy, env and security details that already exist in runbooks.
- `docs/README.md` did not include current frontend architecture, AI state, security docs, test strategy and deploy runbooks.
- `AGENTS.md` repeated detailed frontend/course/deploy rules instead of linking to dedicated docs.
- `PROJECT_STATUS.md` contained stale project and course status.
- `docs/ai-project-state.md` mixed current state with permanent update-format rules.
- `DEPLOY.md` contained an old concrete commit in a generic checkout example.

## Current Structure

- Root `README.md` is the short project entrypoint.
- `docs/README.md` is the full documentation map.
- `AGENTS.md` contains stable Codex rules and links to profile docs.
- `docs/ai-project-state.md` contains current development state only.
- `LOCAL_RUNBOOK.md` remains the local development runbook.
- `DEPLOY.md`, `deploy/README.md` and `deploy/docs/*.md` remain the deploy/Docker/migration/backup/rollback source of truth.
- Security procedures remain in `docs/pre-commit-security.md`, `docs/security-incident-runbook.md`, `docs/security-release-checklist.md` and `deploy/docs/05_SECURITY_SECRETS_ACCESS.md`.

## Preserved Instructions

- Local run and backend/frontend checks.
- Production deploy, update, rollback and hotfix instructions.
- Docker Compose, migrations and backup/restore instructions.
- Security incident, secret rotation and pre-commit checks.
- Course and frontend content standards.

## Needs Verification

- Production state in `deploy/docs/01_CURRENT_STATE.md` was not rechecked against VPS in this docs-only pass.
- Long course plans may still contain historical wording. They were left intact to avoid changing course meaning during documentation cleanup.
