# Documentation audit

Актуально на 2026-06-07.

## Что проверено

- Корневые документы: `README.md`, `PROJECT_STATUS.md`, `DEPLOY.md`, `DEPLOY_SSL.md`, `LOCAL_RUNBOOK.md`, `SMOKE_TESTS.md`.
- Production docs: `deploy/README.md`, `deploy/docs/*.md`.
- Course docs: `docs/base-cpp-course-plan.md`, `docs/course-content-plan.md`.
- Security docs: `docs/security-release-checklist.md`.
- Локальные вспомогательные README: `practice/README.md`, `site/src/styles/README.md`.

## Найдено и исправлено

- Устаревшие формулировки о том, что VPS deploy ещё не выполнен.
- Расхождение между `main`, локальным tag `v0.1.2` и production deploy flow.
- Дублирующиеся длинные deploy-инструкции в корневых документах.
- Опасный пример `git add .` в update runbook.
- Недостаточно явная проверка двойного `/api/api` после frontend hotfix.
- `QWEN_API_KEY` был описан как обязательный всегда, хотя без него сайт работает, а AI endpoint ожидаемо отдаёт `503`.

## Текущая структура

```text
README.md                         обзор проекта
PROJECT_STATUS.md                 текущее состояние и риски
LOCAL_RUNBOOK.md                  локальная разработка
SMOKE_TESTS.md                    smoke-проверки
DEPLOY.md                         короткий deploy entrypoint
DEPLOY_SSL.md                     короткая HTTPS-памятка
docs/README.md                    индекс документации
deploy/docs/README.md             production runbooks
```

## Production notes

- `origin/main` содержит `c05f7b9 Polish guide heading spacing`.
- Push tag `v*` может запускать GitHub Actions deploy.
- Если tag `v0.1.2` не опубликован в GitHub, VPS не сможет сделать `git checkout v0.1.2` после `git fetch --all --tags`.
- Для ручного deploy можно использовать `origin/main` или конкретный commit SHA.

## API path invariant

Frontend должен собирать запросы так:

```text
baseURL=/api
endpoint=/auth/register/
result=/api/auth/register/
```

Запрещённый результат:

```text
/api/api/auth/register/
```

Проверка:

```bash
rg "/api/api" site/src site/dist
```

## Что оставлено без изменений

- Учебный контент курсов не переписывался.
- Backend, API, auth logic и production compose не менялись.
- `practice/README.md` и `site/src/styles/README.md` оставлены почти без изменений, потому что они актуальны и короткие.

## Что стоит сделать позже

- После следующего production deploy обновить `deploy/docs/01_CURRENT_STATE.md`, если фактический server `HEAD` отличается от release-ориентира.
- Если GitHub Actions deploy останется включённым на tag `v*`, явно выбрать одну release-политику: ручной deploy по commit или автоматический deploy по tag.
- После подключения Qwen обновить AI-разделы и убрать пометку о допустимом `503` при пустом `QWEN_API_KEY`.
