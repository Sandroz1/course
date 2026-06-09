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
- Последний commit: `6232d3e Fix course task layout consistency`.
- Не готовы: 11 "Инкапсуляция", 12 "Исключения".
- Будущие части 9.2, 10.1, 10.2 уже существуют, но продолжать их нельзя, пока не закрыты 11-12.

## Последняя закрытая проблема

- Исправлена структура theory/task pages после разделов 8-9.
- Убран дублирующий ручной блок "Практика", который повторял системный блок "Задачи после темы".
- Исправлен task detail layout.
- Inline-code в checklist/list больше не должен распадаться по буквам.
- Блок "Файл" не должен быть большой пустой панелью.
- База C++ и ООП C++ используют одну структуру theory page и task detail.

## Ближайший порядок

1. `Fix course task layout consistency` - done, commit `6232d3e`.
2. `Complete OOP section 10` - done, commit `d9003f2`.
3. `Complete OOP section 11`.
4. `Complete OOP section 12`.
5. `Audit OOP sections 0-12 readiness`.

## Формат обновления после каждой задачи

- last commit;
- done;
- changed files summary;
- checks;
- next task;
- known issues.

## Known Issues

- `docs/course-content-plan.md` может содержать старые формулировки статуса для ранних разделов 6-7; менять только в отдельной задаче.
- Vite chunk-size warning известен и не является build failure.
