# AGENTS.md

Project: Uchicode.

## Main Rule

- Work narrowly. Do not perform broad audits unless explicitly requested.
- Prefer small safe changes over broad refactors.
- Doing nothing is acceptable when the requested issue is already fixed.
- Do not rewrite working code without a clear reason.

## Current Baseline

The project was recently checked and considered stable:

- frontend typecheck, lint and build passed;
- backend check, makemigrations dry-run and tests passed;
- Docker Compose config checks passed;
- Vite chunk-size warning is known and is not a build failure.

Do not repeat full audits unless explicitly requested.

## Repository Areas

- Frontend: `site/src`.
- Frontend styles: CSS, SCSS and CSS Modules under `site/src`.
- Frontend UI rules: `docs/frontend-ui-standards.md`.
- Theory and course content: lesson data, sections, theory, tasks and learning text under `site/src`.
- Backend: `backend`.
- Deploy, VPS, Docker and nginx: `deploy`, `docker`, compose files and `.github/workflows`.
- Generated frontend build: `site/dist`.

## Default Restrictions

- Do not touch backend unless the task explicitly says backend.
- Do not touch Docker, nginx, deploy, GitHub Actions or VPS unless the task is deploy-related.
- Do not edit `.env`, `.env.production`, secrets, `site/dist`, `node_modules`, `.venv`, `db.sqlite3` or backups.
- Do not push, create tags, connect to VPS or deploy unless explicitly requested.
- Normal development prompts do not require deploy; deploy is a separate final manual step.

## Frontend Mode

- For frontend UI tasks, work only in `site/src` and `docs/frontend-ui-standards.md` when needed.
- Do not run Docker checks or production nginx builds for frontend-only changes.
- Do not audit the whole site unless explicitly requested.
- Check only pages and components related to the task.
- If a component is shared, check only its direct usages.
- Do not add dependencies for simple layout or style fixes.
- Run frontend checks once at the end, not after every small edit.

## Theory And Content Mode

- Work only with current course content, lesson data, task text, common errors, guide pages and related docs.
- Do not invent facts about C++.
- When internet access is available, use cppreference, C++ Core Guidelines and high-quality tutorials as references.
- Use forums and Stack Overflow only to identify common beginner mistakes, not as authoritative sources for code.
- Follow `docs/theory-content-standards.md` for theory structure, examples, common mistakes and source rules.
- Keep explanations practical, short and beginner-friendly.
- Every theory section should cover: what it is, why it is needed, minimal example, common mistake and small practice direction.
- Do not add advanced details that distract from the current section level.
- Do not copy long text from external sources.

## Checks

For frontend changes, run once at the end:

```powershell
cd site
npm run typecheck
npm run lint
npm run build
```

Then from repository root:

```powershell
git diff --check
```

For backend changes only:

```powershell
cd backend
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

Windows fallback when `python` is unavailable:

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
.\.venv\Scripts\python.exe manage.py test
```

## CSS And UI Rules

- Use `rem` for scalable UI sizes: font size, spacing, radius, component dimensions, grid `minmax` values and breakpoints when appropriate.
- Keep `px` for 1px borders, hairline dividers, precise shadows, outlines and intentional pixel corrections.
- Do not blindly replace all `px` with `rem`.
- Use shared components and shared styles when useful.
- Do not create components only for decoration.
- Avoid duplicated UI logic and duplicated text.
- Keep typography consistent.
- Hover, focus, active and disabled states must not move icons, buttons, cards or layout.
- Inline code must remain inline and must not show backticks to the user.
- Cards need stable zones: header, meta/content and action.
- Status badges must not move because of title length.
- Count badges must be visually consistent for the same meaning.
- Local `.root` classes in CSS Modules are allowed.
- Avoid duplicating identical root layout rules across pages unless a cleanup task asks for it.

## Task And Lesson Status

- Completed items show `Пройдено`, not `Доступно`.
- `Доступно` means the item can be opened but is not completed.
- `В работе` means the user started but did not complete it.
- `Теория на доработке` means the theory is not ready; the card must remain readable and visually stable.
- Long status labels must not push title, meta or actions out of alignment.

## Text Rules

- Text must be practical, short and specific.
- No motivational filler.
- No repeated generic instructions inside every task.
- No awkward punctuation such as meaningless colons in card meta text.
- Prefer separators like `·` for compact meta rows.
- Put general text in guide pages or shared docs.
- Keep task-specific text precise.

## Docs Mode

- When changing behavior, deployment, UI standards, theory standards or developer workflow, update the relevant docs.
- Keep docs short and operational.
- Do not document temporary implementation details.
- Do not add long reports to docs.

## Deploy Mode

- For VPS or deploy tasks, always backup first.
- Use `docker compose -p app`.
- Do not delete app volumes.
- Do not expose postgres, redis, backend or docker nginx directly to the public.
- Check health endpoints after deploy.
- Provide rollback steps.
- Never print secrets.

## Task Completion

- Before commit, inspect `git diff`.
- Remove `console.log`, debug text, temporary comments, unused imports and dead CSS when safe.
- Commit only files related to the task.
- Use one clear commit unless the task explicitly asks otherwise.
- Do not push unless explicitly requested.
