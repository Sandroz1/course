# Product Roadmap

Единый порядок развития Uchicode. Этот документ задаёт последовательность продуктовых этапов; технические детали остаются в специализированных документах.

## Current Position

- Фаза 0 завершена: docs index, current state, roadmap и тематическая структура документации согласованы.
- Фаза 1 завершена и задеплоена: HomePage и затронутые UI surfaces прошли audit, cleanup и browser QA.
- Фаза 2 завершена и задеплоена: checker foundation и draft flow проверены без исполнения пользовательского кода.
- Фаза 3 завершена: backup, migrations, build, health checks и production smoke прошли на `a4b33d6`.
- Фаза 4 прошла design review для isolated non-production prototype planning: concrete target is a dedicated non-production worker VM. Standalone prototype добавлен в `tools/runner_prototype/`; worker provisioning checklist добавлен, production/API execution не включены.

## Phases

### Phase 0. Documentation consolidation

- Установить один docs index, один current state и один product roadmap.
- Убрать конкурирующие next steps и заменить повторы ссылками на канонические документы.
- Не менять runtime-код.

### Phase 1. HomePage redesign and site-wide UI audit

- Улучшить публичную главную, не возвращая её в `AppLayout`.
- Проверить типографику, кнопки, карточки, статусы, hover/focus, auth/profile/task pages и mobile.
- Проверить light/dark/deep-dark без изменения typography metrics между темами.
- Не добавлять runner и новый учебный контент.

Gate: frontend checks и целевой browser QA проходят, UI не содержит подтверждённых release blockers.

### Phase 2. Review and merge checker draft flow

- Review локальных commits checker data foundation и draft flow.
- Проверить permissions, ownership, stale version, source limits и progress guard.
- Проверить guest/auth, save/restore и unavailable/error states на task page.
- Merge только после backend/frontend checks и чистого git status.

Gate: checker draft работает без исполнения кода; hidden tests и production task versions не добавлены.

### Phase 3. Deploy stable version

- Выполнить release checks после merge фаз 1-2.
- Перед deploy сделать backup, затем использовать production runbook.
- Проверить containers, health endpoints и затронутые product routes.
- Не использовать `docker compose down -v`.

Gate: backup успешен, VPS tree чист, pull fast-forward, health checks зелёные.

### Phase 4. Isolated runner design and provisioning

- Проектировать выполнение только на отдельном worker host/VM.
- Определить queue, sandbox boundary, limits, cleanup, observability и rollback.
- Держать standalone prototype отдельно от backend/API до проверки worker VM isolation и no-network proof.
- Выполнить [runner-worker-provisioning.md](../platform/runner-worker-provisioning.md) до API-integrated runner work.
- Не запускать пользовательский код в Django container или на production app host.

Gate: isolation/security review принят, standalone prototype проверен в non-production Linux environment, worker provisioning checklist проходит на dedicated VM, а API-integrated runner допускается только после dedicated worker VM/no-network proof и status enum mapping cleanup.

### Phase 5. Enable checker for simple tasks

- Начать с простых детерминированных console tasks из [learning-loop-checker-design.md](../platform/learning-loop-checker-design.md).
- Проверить visible I/O contract, immutable version и тесты каждой задачи.
- Не включать сложные ООП, filesystem, menu и multi-file tasks.

Gate: runner isolation, failure handling и production operations проверены.

### Phase 6. Learning loop polish

- Добавить attempt history и понятный следующий шаг в profile.
- Улучшить progress dashboard и learning-loop analytics без хранения source code в аналитике.
- Добавлять sanitized AI explanation только после стабильных deterministic checker results.

### Phase 7. Section 11: Инкапсуляция

- Начать content work только после стабилизации platform foundation.
- Следовать course plan и theory content standards.

### Phase 8. Section 12: Исключения

- Начать только после готовности section 11.

### Phase 9. Audit sections 0-12

- Проверить структуру, тексты, задачи, UI, статусы, фильтры и единый course renderer.
- Исправлять системные проблемы в shared data/components, а не локальными обходами.

### Phase 10. Further product expansion

- Новые темы и курсы.
- Teacher/classroom communication and management.
- Monetization, analytics and commercial scenarios.
- Каждый крупный сценарий требует отдельного product/security review; payments также требуют legal/payment pass.

## Do Not Do Now

- Не делать push/deploy без явного запроса.
- Не запускать runner в backend container или на production app host.
- Не запускать пользовательский C++ код до завершения phase 4 gate.
- Не добавлять production hidden tests и не seed production checker task versions.
- Не начинать sections 11/12 до соответствующих фаз roadmap.
- Не смешивать content work с Docker/nginx/security changes.
- Не переносить весь course content в backend одним большим изменением.
- Не добавлять payments/monetization без отдельного security/payment/legal pass.
- Не дублировать длинные процессы: полный процесс живёт в одном профильном документе.

## Detailed Sources

- Current state: [ai-project-state.md](../state/ai-project-state.md).
- Checker/API boundaries: [learning-loop-checker-design.md](../platform/learning-loop-checker-design.md).
- Runner threat model: [runner-design.md](../platform/runner-design.md).
- Runner worker provisioning/security: [runner-worker-provisioning.md](../platform/runner-worker-provisioning.md).
- Frontend architecture and UI: [ARCHITECTURE.md](../architecture/ARCHITECTURE.md), [frontend-ui-standards.md](../frontend/frontend-ui-standards.md).
- Course plans: [course-content-plan.md](../courses/course-content-plan.md), [base-cpp-course-plan.md](../courses/base-cpp-course-plan.md).
- Deploy and rollback: [DEPLOY.md](../../DEPLOY.md), [deploy/docs/README.md](../../deploy/docs/README.md).
- Security: [pre-commit-security.md](../security/pre-commit-security.md), [security-incident-runbook.md](../security/security-incident-runbook.md).
