# Uchicode Presentation Materials

Короткий набор материалов для демонстрации проекта, защиты и дальнейшего продуктового обсуждения. Это не заменяет технические runbooks; для запуска и deploy использовать `README.md`, `LOCAL_RUNBOOK.md`, `DEPLOY.md` и `deploy/docs/README.md`.

## Краткое описание

Uchicode - учебная платформа по C++ для новичков, которым нужен понятный маршрут: короткая теория, рабочий пример, частая ошибка, практическая задача и проверка прогресса в одном продукте.

## Проблема и аудитория

Целевая аудитория:

- начинающие, которым сложно понять, что открыть первым и как проверить результат;
- студенты, которым нужны маленькие практические шаги вместо длинных конспектов;
- преподаватели или менторы, которым нужна структура тем, задач и типовых ошибок.

Проблема: в C++ новичок часто теряется между синтаксисом, файлами, ошибками компиляции и большим количеством теории. Uchicode снижает хаос за счёт последовательного маршрута и маленьких задач.

## Основные возможности

- Публичная главная без app-shell, которая объясняет первый шаг.
- Курсы "База C++" и "ООП C++" с разделами, статусами готовности и задачами.
- Страницы теории с единым renderer, CodeBlock, частыми ошибками и самопроверкой.
- Каталог задач, фильтры, task detail flow и starter code на странице задачи.
- AI assistant внутри учебной зоны без изменения backend/API contract после refactor.
- Auth/profile/progress foundation для будущего продуктового развития.
- Production deploy через Docker Compose, host Nginx, PostgreSQL и Redis.

## Архитектура простыми словами

- `site/src` - React + TypeScript frontend.
- `site/src/app` - кастомный router и разделение public `/` от app-shell.
- `site/src/pages` - route-level страницы.
- `site/src/components/shared` - общие UI-компоненты: buttons, logo, CodeBlock, learning UI.
- `site/src/content/course` и `site/src/data` - учебный контент, порядок разделов и задачи.
- `backend` - Django API, auth/session, AI endpoint, progress.
- `deploy` и compose-файлы - production runbooks и инфраструктурная конфигурация.

## Что уже реализовано

- Public HomePage стабилизирована и отделена от app-shell.
- App routes работают внутри `AppLayout`: courses, tasks, guide, common errors, auth/profile, task/course detail.
- Unknown routes показывают `NotFoundPage`, а не публичную главную.
- Frontend foundation, typography, CodeBlock readability и AI assistant refactor задеплоены.
- Backend/session/build stability pass прошёл без runtime blockers.
- Vite build tooling stabilised: route-level lazy split задеплоен, Vite 8 migration подготовлена в finalization branch.
- ООП C++ разделы 0-10 закрыты без пробела; разделы 11-12 остаются content backlog.

## Что показать на демо

1. Открыть `/` и показать, что главная объясняет первый шаг без sidebar.
2. Перейти в `/courses`, затем в `ООП C++`.
3. Открыть `/courses/oop-cpp/delegating-constructors`.
4. Показать CodeBlock, блок задач после темы и навигацию между темами.
5. Открыть `/tasks/00-01-minimal-program`.
6. Показать task detail: цель, рабочий файл, подсказки, частые ошибки, самопроверка.
7. Открыть AI assistant на theory или task page и показать стабильную панель.
8. Открыть unknown route и показать корректный fallback.

## Сценарий на 2-3 минуты

Uchicode решает одну конкретную проблему: новичку в C++ часто непонятно, с чего начать, где писать код и как понять, что он сделал задачу правильно. На главной сразу есть первый маршрут без лишнего интерфейса. Внутри курса каждая тема ведёт через короткое объяснение, пример, типовую ошибку и практику. Задачи не висят отдельно от теории: они привязаны к разделам и показывают starter code на странице, а `practice` остаётся внутренним источником заготовок. Технически проект разделён на React frontend, Django backend и production deploy через Docker Compose. Сейчас платформа готова как стабильная база: можно продолжать контент, добавлять продуктовые функции и развивать монетизацию без переписывания фундамента.

## Сценарий на 5-7 минут

1. Начать с проблемы: C++ сложен для новичка не только синтаксисом, но и отсутствием ясного первого шага.
2. Показать публичную главную: она не смешана с рабочим интерфейсом и ведёт к первому уроку или задачам.
3. Показать структуру курса: разделы, статусы готовности, честный content backlog.
4. Открыть theory page: единый layout, CodeBlock, ошибки, самопроверка, задачи после темы.
5. Открыть task detail: условие, starter code, результат, подсказки и self-check.
6. Показать AI assistant как вспомогательный инструмент внутри учебной зоны, не как главное обещание продукта.
7. Показать техническую готовность: typed React/Vite build, Django tests, compose checks, deploy runbooks, security docs.
8. Завершить планом развития: закрыть разделы 11-12, подготовить аудит 0-12, улучшить backend stability/performance, затем переходить к платным сценариям.

## План развития

- Закрыть ООП C++ section 11 "Инкапсуляция".
- Закрыть section 12 "Исключения".
- Провести readiness audit по ООП C++ 0-12.
- Расширить progress/product analytics только после стабилизации контента.
- Подготовить первые платные сценарии: расширенные задачи, проверка решений, трекинг прогресса, mentor/admin tools.
- Перед оплатой отдельно спроектировать pricing, Stripe/ЮKassa/другой provider и юридические ограничения.

## Сильные стороны

- Продукт не держится на одной landing page: есть курс, задачи, backend, auth/progress и production deploy.
- Контент и layout разделены: новые темы добавляются через data/content, а не через новый JSX.
- Есть quality bar для frontend, docs workflow и deploy/security runbooks.
- CodeBlock, AI assistant и route-level lazy split уже стабилизированы.
- Неполные главы явно отражены как content backlog, а не скрываются.

## Честные ограничения

- Разделы 11-12 ещё не готовы.
- Course content не является полным коммерческим каталогом.
- AI assistant не должен продаваться как основная ценность до отдельного product validation.
- Backend/session/security прошли текущие проверки, но перед реальной монетизацией нужен отдельный security/payment pass.
- Визуальный продукт стабилизирован, но дальнейшие фичи должны проходить тот же quality gate.
