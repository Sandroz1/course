# AGENTS.md

Project: Uchicode.

## Read First

- Documentation map: [docs/README.md](docs/README.md).
- Current state and next task: [docs/state/ai-project-state.md](docs/state/ai-project-state.md).
- Product sequence and current restrictions: [docs/product/product-roadmap.md](docs/product/product-roadmap.md).
- Frontend architecture: [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md).
- Frontend UI rules: [docs/frontend/frontend-ui-standards.md](docs/frontend/frontend-ui-standards.md).
- Theory/content rules: [docs/courses/theory-content-standards.md](docs/courses/theory-content-standards.md).
- Security checks: [docs/security/pre-commit-security.md](docs/security/pre-commit-security.md).

## Main Rules

- Work narrowly. Prefer small safe changes over broad refactors.
- Read the relevant files before editing.
- Before a task, read `AGENTS.md`, `docs/state/ai-project-state.md` and the task-specific docs, then verify them against `git status`, `git log`, the current branch and the actual code state.
- Preserve existing behavior unless the task explicitly asks to change it.
- Do not invent files, endpoints, commands or project behavior.
- Do not add dependencies unless the task truly requires it.
- Do not push, create tags, connect to VPS or deploy unless explicitly requested.
- Do not expose secrets, tokens, passwords or private data.
- Doing nothing is acceptable when the requested issue is already fixed.

## Documentation Freshness

- Treat docs as required context, not as the only source of truth. If docs conflict with the current git branch, commits, production state or code, record the mismatch and update docs or clearly report that they are stale.
- When a task changes production state, routing, deploy status, backlog, UI quality bar, architecture or an important workflow, update the matching `.md` file in the same pass unless the user explicitly asks for code-only work.
- Keep deployment state labels precise: use `production deployed app hash`, `latest docs/state commit` and `current main hash`. Do not write `production/main hash` when those values differ.
- If roadmap, current state and a specialized document disagree, stop and resolve the documentation conflict before implementation.

## Documentation Routing

- General task: read the docs index, current state and product roadmap.
- Checker/runner task: also read `docs/platform/learning-loop-checker-design.md`.
- Course task: read the matching course plan and `docs/courses/theory-content-standards.md`.
- UI task: read `docs/frontend/frontend-ui-standards.md` and the relevant focused plan.
- Deploy task: use `DEPLOY.md` and `deploy/docs/README.md`; do not reconstruct production commands from old chat history.
- Security/secrets task: use `docs/security/pre-commit-security.md`, the incident runbook and production security docs.

## Quality Bar

- Uchicode is a coherent learning product, not a set of generated pages.
- Uchicode is a production/business project. Do not treat it as a pet project and do not accept "it works" as the quality bar.
- Simplicity is acceptable only when it makes the code more reliable, clearer and cheaper to maintain.
- Do not do chaotic refactors or rename files/folders for taste. Structural changes need a practical reason: less duplication, clearer ownership, easier extension, lower risk for routes/data/content or better fit with the current architecture.
- A task is done only when the result is stable, logical, usable, visually clean and does not look like random AI output.
- For requests like "доработай", "обработай" or "доведи до ума", do a self-review before commit: remove repetition, weak copy, empty promises, chaotic CSS/TSX and UX regressions.
- Incomplete course chapters are acceptable content state. They do not justify lowering the quality of architecture, navigation, typography, layout, clickable states or stable pages.
- Do not make a new area worse than already stable parts of the project.
- For safe-pass work, keep the scope explicit: fix the named surface, verify it, and do not fold in unrelated UI cleanup.
- Old rejected HomePage redesign branches are reference-only. Do not merge or cherry-pick large HomePage commits blindly.

## Engineering Rules

- React/TypeScript components must have clear responsibility.
- Keep state minimal and do not duplicate values that can be derived safely.
- Keep props and types explicit where they protect behavior or make ownership clearer.
- Do not scatter routes, ids and slugs as magic strings when a current route/data helper already exists.
- Use shared components only when they reduce real duplication or protect an established UI contract.
- Comments are useful when they explain a non-obvious business rule, an architecture decision, a fragile route/data link or why a solution is intentionally shaped a certain way.
- Do not add comments that restate obvious code. If a comment is needed only because the code is chaotic, first consider making the code clearer.

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

- Follow [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) for layout vs content data boundaries.
- Follow [docs/frontend/frontend-ui-standards.md](docs/frontend/frontend-ui-standards.md) for visual rules.
- Keep shared course/task rendering shared. New sections should add content/data, not custom page layout.
- Do not run Docker or production checks for frontend-only work.

## Course And Content Work

- Follow [docs/courses/theory-content-standards.md](docs/courses/theory-content-standards.md).
- Use [docs/courses/course-content-plan.md](docs/courses/course-content-plan.md) and [docs/courses/base-cpp-course-plan.md](docs/courses/base-cpp-course-plan.md) for course plans.
- Keep explanations practical, short and beginner-friendly.
- Do not add advanced C++ details that distract from the current section level.
- Add a theory slug to `readyTheorySlugs` only when theory and related tasks are actually ready.

## Security Work

- Follow [docs/security/pre-commit-security.md](docs/security/pre-commit-security.md).
- For suspected secret leaks, follow [docs/security/security-incident-runbook.md](docs/security/security-incident-runbook.md).
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
