# AI Project State

Документ фиксирует только текущее состояние проекта и ближайшие задачи. Постоянные правила лежат в [../AGENTS.md](../AGENTS.md) и [../README.md](../README.md).

## Project Map

- Проект: Uchicode.
- Стек: React + TypeScript + Vite, Django backend.
- Основная зона frontend: `site/src`.
- Контент курса: `site/src/content/course`.
- Разделы курса: `site/src/data/courseSections.ts`.
- Порядок курса: `site/src/data/courses.ts`.
- Задачи: `site/src/data/tasks.ts`.
- Практические файлы: `practice`.

## Current Status

- ООП C++ разделы 0-10 закрыты без пробела.
- Раздел 8 "Список инициализации" готов.
- Раздел 9 "std::vector" готов.
- Раздел 10 "Делегирование конструкторов" готов.
- Не готовы: 11 "Инкапсуляция", 12 "Исключения".
- Будущие части 9.2, 10.1, 10.2 уже существуют, но продолжать их нельзя, пока не закрыты 11-12.
- Следующая задача после docs cleanup: `Complete OOP section 11 "Инкапсуляция"`.

## Current Product Priority

- Ближайшая работа должна держать Uchicode как цельный учебный продукт, а не набор сгенерированных страниц.
- Неполные главы курса допустимы, но базовая архитектура, навигация, visual system, typography, layout, кликабельность и основные страницы должны оставаться чистыми и согласованными.
- Для задач формата "доработай" или "доведи до ума" обязательны self-review, удаление повторов, слабых текстов, пустых обещаний и проверка, что результат не выглядит сырым.

## Recent Important Commits

- `99ed86f` - `Polish task detail layout consistency`.
- `41768f7` - `Improve frontend architecture foundations`.
- `18b4b77` - `Unify course and task content rendering`.
- `d9003f2` - `Complete OOP section 10`.
- `aa61ebb` - `Complete OOP section 9`.

## Done

- Course/task rendering unified: theory pages and task detail pages use common rendering patterns.
- Task detail visual consistency checked against `tasks/00-01-minimal-program`.
- Frontend architecture foundations documented in `docs/ARCHITECTURE.md`.
- Route constants exist in `site/src/app/routes.ts`.
- Markdown parsing moved to `site/src/utils/lessonMarkdown.ts`.
- AI lesson selection moved to `site/src/features/ai-assistant/hooks/useLessonSelection.ts`.
- Body scroll lock moved to `site/src/hooks/useBodyScrollLock.ts`.
- Security env handling documented; real env files should stay out of git.

## Checks Snapshot

- Last frontend passes completed before this docs cleanup: `npm run typecheck`, `npm run lint`, `npm run build`.
- Vite chunk-size warning is known and is not a build failure.
- Docs-only changes should run only repository checks unless code changes accidentally appear.

## Next Tasks

1. Complete OOP section 11 "Инкапсуляция".
2. Complete OOP section 12 "Исключения".
3. Audit OOP sections 0-12 readiness.
4. Coordinate manual secret rotation and git history cleanup if `.env.production` ever left the local machine.

## Known Issues

- `docs/course-content-plan.md` may contain old wording for early sections 6-7; update only in a dedicated course-plan pass.
- База C++ sections 0-4 remain `needs-theory`; CoursePage shows placeholder pages for them.
- If real production secrets were pushed or shared before the security pass, manual rotation and history cleanup are still required.
- Page-level lazy loading, auth reset event cleanup and a unit test runner remain future frontend tasks.

## Do Not Do Now

- Do not deploy or push unless explicitly requested.
- Do not continue 9.2, 10.1, 10.2 before 11-12 are closed.
- Do not add section 12 before section 11.
- Do not mix content work with Docker/nginx/security changes.
