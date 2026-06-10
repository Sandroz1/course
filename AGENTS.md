# AGENTS.md

Project: Uchicode.

## Read First

- Documentation map: [docs/README.md](docs/README.md).
- Current state and next task: [docs/ai-project-state.md](docs/ai-project-state.md).
- Frontend architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- Frontend UI rules: [docs/frontend-ui-standards.md](docs/frontend-ui-standards.md).
- Theory/content rules: [docs/theory-content-standards.md](docs/theory-content-standards.md).
- Security checks: [docs/pre-commit-security.md](docs/pre-commit-security.md).

## Main Rules

- Work narrowly. Prefer small safe changes over broad refactors.
- Read the relevant files before editing.
- Preserve existing behavior unless the task explicitly asks to change it.
- Do not invent files, endpoints, commands or project behavior.
- Do not add dependencies unless the task truly requires it.
- Do not push, create tags, connect to VPS or deploy unless explicitly requested.
- Do not expose secrets, tokens, passwords or private data.
- Doing nothing is acceptable when the requested issue is already fixed.

## Repository Areas

- Frontend: `site/src`.
- Frontend styles: CSS, SCSS and CSS Modules under `site/src`.
- Backend: `backend`.
- Course content: `site/src/content/course`.
- Course sections/order/tasks: `site/src/data`.
- Practice files: `practice`.
- Deploy, Docker, nginx and VPS docs/configs: `deploy`, compose files and `.github/workflows`.
- Generated frontend build: `site/dist`.

## Default Restrictions

- Do not touch backend for frontend-only tasks.
- Do not touch Docker, nginx, deploy, GitHub Actions or VPS unless the task is deploy-related.
- Do not edit `.env`, `.env.production`, secrets, `site/dist`, `node_modules`, `.venv`, `db.sqlite3` or backups.
- Do not rewrite working code without a clear reason.
- If the worktree is dirty, preserve user changes. Do not revert changes you did not make.

## Frontend Work

- Follow [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for layout vs content data boundaries.
- Follow [docs/frontend-ui-standards.md](docs/frontend-ui-standards.md) for visual rules.
- Keep shared course/task rendering shared. New sections should add content/data, not custom page layout.
- Do not run Docker or production checks for frontend-only work.

## Course And Content Work

- Follow [docs/theory-content-standards.md](docs/theory-content-standards.md).
- Use [docs/course-content-plan.md](docs/course-content-plan.md) and [docs/base-cpp-course-plan.md](docs/base-cpp-course-plan.md) for course plans.
- Keep explanations practical, short and beginner-friendly.
- Do not add advanced C++ details that distract from the current section level.
- Add a theory slug to `readyTheorySlugs` only when theory and related tasks are actually ready.

## Security Work

- Follow [docs/pre-commit-security.md](docs/pre-commit-security.md).
- For suspected secret leaks, follow [docs/security-incident-runbook.md](docs/security-incident-runbook.md).
- Never print, copy, commit or move real secrets into tracked files.

## Deploy Work

- Use [DEPLOY.md](DEPLOY.md) as the short entrypoint.
- Use [deploy/docs/README.md](deploy/docs/README.md) for full production runbooks.
- For VPS/deploy tasks, backup first and provide rollback steps.
- Do not delete app volumes.

## Checks

For frontend changes, run once at the end:

```powershell
cd site
npm run typecheck
npm run lint
npm run build
```

For backend changes:

```powershell
cd backend
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

Windows backend fallback when `python` is unavailable:

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
.\.venv\Scripts\python.exe manage.py test
```

For docs-only changes:

```powershell
git diff --check
git status -sb
git diff --stat
```

## Before Commit

- Inspect `git diff`.
- Remove debug output, temporary comments, unused imports and dead CSS when safe.
- Commit only files related to the task.
- Use one clear commit unless the task explicitly asks otherwise.
- Do not push unless explicitly requested.
