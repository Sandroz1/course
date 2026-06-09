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
- Последняя задача/commit: `Unify course theory page structure`.
- Не готовы: 11 "Инкапсуляция", 12 "Исключения".
- Будущие части 9.2, 10.1, 10.2 уже существуют, но продолжать их нельзя, пока не закрыты 11-12.

## Последняя закрытая проблема

- Унифицирована структура theory pages Базы C++ и ООП C++.
- `## Мини-проверка` и `## Самопроверка` идут через один интерактивный self-check component.
- `## Частые ошибки` выводится единым compact pattern с карточками ошибок и общим `CodeBlock`.
- Блок "Задачи после темы" больше не строит placeholder-карточки из ручных practice-списков; при отсутствии задач показывает compact empty state.
- Previous/next navigation использует одинаковый link pattern и status badges для закрытых соседних разделов.
- Ручные списки practice-файлов внутри theory content скрываются системным renderer; practice-файлы показываются на detail page задачи.

## Последние проверки

- `cd site && npm run typecheck` - passed.
- `cd site && npm run lint` - passed.
- `cd site && npm run build` - passed, Vite chunk-size warning известен.
- Manual browser check - passed: section 5 Базы C++, OOP sections 8, 9, 10, старый OOP section, `/tasks`, task detail `09-vector-01-numbers`; desktop, mobile, light, dark, deep-dark; console errors 0; horizontal overflow не найден.

## Ближайший порядок

1. `Fix course task layout consistency` - done, commit `6232d3e`.
2. `Complete OOP section 10` - done, commit `d9003f2`.
3. `Unify course theory page structure` - done.
4. `Complete OOP section 11`.
5. `Complete OOP section 12`.
6. `Audit OOP sections 0-12 readiness`.

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
- Vite chunk-size warning известен и не является build failure.
