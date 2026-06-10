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
- Последняя задача/commit: `Improve frontend architecture foundations`.
- Не готовы: 11 "Инкапсуляция", 12 "Исключения".
- Будущие части 9.2, 10.1, 10.2 уже существуют, но продолжать их нельзя, пока не закрыты 11-12.

## Последняя закрытая проблема

- Добавлен `docs/ARCHITECTURE.md` с картой frontend, route/data/content зонами и правилами добавления section/task.
- Добавлен `docs/frontend-test-strategy.md`; test runner в проекте пока отсутствует, новые зависимости не добавлялись.
- Кастомный router оставлен без миграции на React Router; route constants/prefixes вынесены в `site/src/app/routes.ts`.
- Markdown parsing из `LessonContent` вынесен в pure util `site/src/utils/lessonMarkdown.ts`.
- Selection state/listeners AI assistant вынесены в `site/src/features/ai-assistant/hooks/useLessonSelection.ts`.
- Body scroll lock вынесен в общий hook `site/src/hooks/useBodyScrollLock.ts`.
- Page-level `React.lazy` + `Suspense` отложены до отдельной задачи с единым loading fallback.
- Auth reset без `window.dispatchEvent` отложен до отдельной задачи: текущий API fetch flow требует отдельного контракта с `AuthProvider`.

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
6. `Improve frontend architecture foundations` - done.
7. Manual secret rotation and history cleanup coordination, if `.env.production` ever left the local machine.
8. `Complete OOP section 11`.
9. `Complete OOP section 12`.
10. `Audit OOP sections 0-12 readiness`.

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
- Page-level lazy loading, auth reset event cleanup и unit test runner остаются future tasks, не смешивать с продолжением учебного контента.
