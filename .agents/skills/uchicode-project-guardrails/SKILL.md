---
name: uchicode-project-guardrails
description: Apply Uchicode repository architecture, scope, verification, documentation, Git, and production-safety rules. Use for any implementation, review, refactor, documentation, Git, checker, frontend, backend, or deployment task in the Uchicode/course repository.
---

# Uchicode Project Guardrails

Treat Uchicode as a production-sensitive learning platform: Django REST Framework in `backend`, React/Vite/TypeScript in `site`, course data in `site/src/data` and `site/src/content/course`, and VPS/Docker Compose/Nginx deployment.

## Start With Current State

1. Read `AGENTS.md`, `docs/README.md`, `docs/state/ai-project-state.md`, and `docs/product/product-roadmap.md`.
2. Read the task-specific architecture, UI, platform, course, security, or deploy document.
3. Verify docs against the current branch, `git status`, recent commits, actual code, scripts, and tests.
4. Preserve unrelated work and keep the change scoped.

## Safety Boundaries

- Do not push, deploy, access production/VPS, or change secrets, env, volumes, or production data unless explicitly requested.
- Keep `CHECKER_EXECUTION_ENABLED=false` unless a separately approved execution stage explicitly changes it.
- Do not add Piston, runner, queue, or execution API integration unless the task is specifically for that approved roadmap stage.
- Do not create production checker task versions or hidden tests casually.
- Do not start sections 11/12 before the roadmap gate.
- Do not add dependencies or broad refactors without a concrete need and verification path.

## Delivery Workflow

- Prefer a scoped `codex/` branch, relevant checks, one coherent commit, then separate review/merge/push steps.
- Update the canonical state or roadmap document after a major verified stage; do not duplicate status across general docs.
- Run only the checks relevant to changed areas, plus `git diff --check` and a clean-status review.
- Report blockers and larger improvements separately instead of silently expanding scope.
