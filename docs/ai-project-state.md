# AI Project State

Проект: Uchicode.

## Карта проекта

- Стек: React + TypeScript + Vite.
- Основная зона frontend: `site/src`.
- Контент курса: `site/src/content/course`.
- Разделы курса: `site/src/data/courseSections.ts`.
- Порядок курса: `site/src/data/courses.ts`.
- Задачи: `site/src/data/tasks.ts`.
- Практические файлы: `practice`.

## Текущий статус

- ООП C++ разделы 0-10 закрыты без пробела.
- Раздел 8 "Список инициализации" готов.
- Раздел 9 "std::vector" готов.
- Раздел 10 "Делегирование конструкторов" готов.
- Последняя задача/commit: `Secure env handling and document secret rotation`.
- Не готовы: 11 "Инкапсуляция", 12 "Исключения".
- Будущие части 9.2, 10.1, 10.2 уже существуют, но продолжать их нельзя, пока не закрыты 11-12.

## Последняя закрытая проблема

- Выполнен security-fix pass по env/secrets без push/deploy.
- В текущем git index реальные `.env*` файлы не отслеживаются; tracked только example-шаблоны.
- Локальный `.env.production` существует в workspace, но игнорируется `.gitignore` и не добавлен в index.
- `.gitignore` переведён на deny-by-default для `.env*` с allowlist для `.env.example` и `.env.*.example`.
- Добавлен корневой `.env.example` с placeholders.
- Добавлены runbook для secret incident и pre-commit security checks.
- Production security settings проверены только чтением: Django secure flags управляются env, HSTS default `0`, `CSRF_COOKIE_HTTPONLY` не включался; nginx уже содержит basic headers.

## Последние проверки

- `git diff --check` - passed.
- `git status -sb` - passed.
- `git diff --stat` - passed.

## Ближайший порядок

1. `Fix course task layout consistency` - done, commit `6232d3e`.
2. `Complete OOP section 10` - done, commit `d9003f2`.
3. `Unify course theory page structure` - done.
4. `Secure env handling and document secret rotation` - done.
5. Manual secret rotation and history cleanup coordination, if `.env.production` ever left the local machine.
6. `Complete OOP section 11`.
7. `Complete OOP section 12`.
8. `Audit OOP sections 0-12 readiness`.

## Формат обновления после каждой задачи

- last commit;
- done;
- changed files summary;
- checks;
- next task;
- known issues.

## Known Issues

- `docs/course-content-plan.md` может содержать старые формулировки статуса для ранних разделов 6-7; менять только в отдельной задаче.
- База C++ разделы 0-4 остаются `needs-theory`; для них CoursePage показывает placeholder страницы.
- Если реальные production secrets уже были pushed/shared до этого pass, нужно вручную выполнить rotation + history cleanup по `docs/security-incident-runbook.md`.
- Vite chunk-size warning известен и не является build failure.
