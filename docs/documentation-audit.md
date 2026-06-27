# Documentation Audit

Актуально на 2026-06-28. Это audit note, не current state и не roadmap.

## Scope

- Root entrypoints and local/smoke/deploy runbooks.
- All markdown under `docs`, `deploy/docs`, `practice` and `site/src/styles`.
- Relative markdown links and conflicting next-step/roadmap statements.

## Findings And Decisions

- Roadmap был размазан между current state, checker design, course plans и presentation materials. Канонический порядок перенесён в [product-roadmap.md](product-roadmap.md).
- `ai-project-state.md` содержал длинную release history, backup list и повтор checks. Оставлен короткий verified snapshot, local work и next stage.
- Root `README.md`, `DEPLOY.md` и `deploy/README.md` повторяли команды профильных runbooks. Они сокращены до entrypoints и safety rules.
- Course и presentation docs указывали sections 11/12 как ближайшую работу. Теперь они сохраняют content order, но подчиняются product phases.
- Checker design остаётся техническим source of truth и больше не задаёт общий продуктовый next step.
- UI, security, local setup, backup/restore and deploy troubleshooting docs оставлены специализированными: их детали не переносились в roadmap.
- `frontend-test-strategy.md` содержал устаревшее допущение про Vite chunk warning; оно удалено.
- Broken relative markdown links не найдены до правок; ссылки повторно проверяются после consolidation.

## Canonical Roles

- Docs entrypoint: [README.md](README.md).
- Current state: [ai-project-state.md](ai-project-state.md).
- Product order and restrictions: [product-roadmap.md](product-roadmap.md).
- Specialized technical/operations docs: architecture, UI, checker, course, deploy and security files linked from the index.

## Needs Verification

- Production server `HEAD`, containers and backup state не проверялись в docs-only pass. Перед deploy сверить фактический VPS по production runbook.
