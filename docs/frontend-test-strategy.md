# Frontend Test Strategy

Короткая стратегия проверок frontend без добавления новых зависимостей в текущем проходе.

## Текущая автоматическая проверка

В `site/package.json` сейчас нет test runner. Доступные команды:

- `npm run typecheck`
- `npm run lint`
- `npm run build`

Эти проверки обязательны для frontend-изменений. `npm run build` может показывать известный Vite chunk-size warning; это не считается падением сборки.

## Ручной smoke для routing/layout

После изменений в router, layout, CoursePage или TaskDetailsPage проверить:

- `/`
- `/courses`
- `/courses/oop-cpp`
- `/tasks`
- `/tasks/00-01-minimal-program`
- `/login`
- `/register`
- `/profile`, если профиль доступен в текущей auth-сессии

Для учебных страниц дополнительно проверить desktop/mobile, light/dark/deep-dark themes, console errors и horizontal overflow.

## Кандидаты для будущих pure-utils тестов

Когда будет одобрено добавление test runner:

- `site/src/utils/lessonMarkdown.ts` - split sections, heading ids, practice/mistakes/check heading detection.
- `site/src/utils/taskDisplay.ts` - форматирование статусов, уровней и metadata.
- `site/src/utils/slug.ts` - `toPath` и `currentPath` при custom base path.
- `site/src/app/routes.ts` - route prefixes and strip helper.

## Что не тестировать unit-тестами первым

- Shiki rendering.
- Полный browser routing flow.
- API integration с backend.
- Responsive visual states.

Для этих сценариев сначала достаточно build + ручной browser smoke. E2E можно добавлять отдельной задачей, если появится стабильная инфраструктура.
