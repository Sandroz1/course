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
- Последняя задача/commit: `Unify course and task content rendering`.
- Не готовы: 11 "Инкапсуляция", 12 "Исключения".
- Будущие части 9.2, 10.1, 10.2 уже существуют, но продолжать их нельзя, пока не закрыты 11-12.

## Последняя закрытая проблема

- Зафиксирован content rendering contract для CoursePage и TaskDetailsPage.
- Эталон theory page: раздел 5 Базы C++ `/courses/base-cpp/conditions`.
- Эталон task detail page: `/tasks/00-01-minimal-program`.
- Theory common mistakes идут через общий renderer: eyebrow `Разбор ошибок`, title `Частые ошибки`.
- Theory self-check идёт через общий component: eyebrow `Самопроверка`, title `Мини-проверка`.
- `## Мини-проверка` и `## Самопроверка` в content дают одинаковый UI.
- `Задачи после темы`, empty state и previous/next navigation остаются системными блоками CoursePage.
- TaskDetailsPage для задач 8-10 использует тот же shared flow, что и старые задачи: header/meta/action, задание, file/code panel, help collapsibles, related theory.

## Последние проверки

- `cd site && npm run typecheck` - passed.
- `cd site && npm run lint` - passed.
- `cd site && npm run build` - passed, Vite chunk-size warning известен.
- Manual browser check - passed: `/courses/base-cpp/conditions`, `/course/initializer-list`, `/course/vector`, `/course/delegating-constructors`, `/tasks/00-01-minimal-program`, `/tasks/08-01-plate-constructors`, `/tasks/09-vector-01-numbers`, `/tasks/10-delegation-01-worker-constructors`; desktop/mobile; console errors 0; horizontal overflow не найден.
- `git diff --check` - passed.
- `git status -sb` - passed.
- `git diff --stat` - passed.

## Ближайший порядок

1. `Fix course task layout consistency` - done, commit `6232d3e`.
2. `Complete OOP section 10` - done, commit `d9003f2`.
3. `Unify course theory page structure` - done.
4. `Secure env handling and document secret rotation` - done.
5. `Unify course and task content rendering` - done.
6. Manual secret rotation and history cleanup coordination, if `.env.production` ever left the local machine.
7. `Complete OOP section 11`.
8. `Complete OOP section 12`.
9. `Audit OOP sections 0-12 readiness`.

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
