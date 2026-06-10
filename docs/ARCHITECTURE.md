# Frontend Architecture

Короткая карта frontend-части Uchicode. Документ описывает, куда добавлять код и данные, чтобы новые разделы курса не создавали новый layout.

## Стек и корень

- Стек: React + TypeScript + Vite.
- Основная зона: `site/src`.
- Глобальная оболочка приложения: `site/src/app` и `site/src/components/layout`.
- Кастомный роутер: `site/src/app/router.tsx`.
- Route constants и route prefixes: `site/src/app/routes.ts`.

## Структура `site/src`

- `app` - вход приложения, providers, кастомный router и route config.
- `pages` - route-level страницы. Здесь собирается страница, но не должен жить уникальный layout под каждый новый урок.
- `components/layout` - основная оболочка, sidebar, topbar, account menu, theme switcher, search.
- `components/shared` - переиспользуемые UI-компоненты: buttons, code block, learning UI, dropdown.
- `content` - учебный текст разделов. Это content data, а не layout.
- `data` - реестры курсов, секций, статусов и задач.
- `features` - крупные продуктовые фичи со своей внутренней структурой, например AI assistant.
- `hooks` - общие React hooks без привязки к одной странице.
- `lib` - API-клиенты и интеграционная логика.
- `utils` - pure helpers и небольшие browser helpers.
- `styles` - global reset, theme variables и базовая типографика.

## Pages

`pages` отвечают за route-level composition:

- `CourseIndexPage` показывает список разделов курса.
- `CoursePage` показывает одну theory page и системный блок задач после темы.
- `TasksIndexPage` показывает каталог задач и фильтры.
- `TaskDetailsPage` показывает одну задачу через общий task detail flow.
- Auth/profile/guide pages используют свои страницы, но общие layout/components.

Правило: новая тема курса должна подключаться через data/content. Новый layout в `pages` нужен только если появляется новый тип страницы.

## Course Content

Теория ООП C++ лежит в `site/src/content/course`.

Основные связи:

- `site/src/content/course/<topic>.ts` - текст теории.
- `site/src/data/courseSections.ts` - описание section, slug, status, related tasks.
- `site/src/data/courses.ts` - порядок разделов в курсе и `readyTheorySlugs`.
- `site/src/data/tasks.ts` - задачи, привязанные к `course` и `section`.
- `practice` - стартовые файлы для практики.

`LessonContent` рендерит markdown-подобный контент через общий renderer. Pure-разбор секций лежит в `site/src/utils/lessonMarkdown.ts`.

## Tasks

Задача добавляется как data entry в `site/src/data/tasks.ts`.

Минимальный contract задачи:

- `id`
- `title`
- `course`
- `section`
- `level`
- `status`
- `tags`
- `goal`
- `description`
- `result`
- `files`
- `hints`
- `commonMistakes`
- `selfCheck`

Если для задачи нужен стартовый код, файл кладётся в `practice`, а путь указывается в `files`.

## API

- Общий API helper: `site/src/lib/api.ts`.
- Auth API: `site/src/lib/authApi.ts`.
- Progress API/cache: `site/src/lib/progressApi.ts`.
- AI API/usage: `site/src/lib/aiApi.ts`, `site/src/lib/aiUsage.ts`.

API-слой не должен знать про конкретные страницы. Страницы и features вызывают `lib`, а не наоборот.

## Как добавить section

1. Добавить или обновить theory content в `site/src/content/course`.
2. Подключить content в `site/src/data/courseSections.ts`.
3. Проверить `slug`, `status`, `course`, `order`, `relatedTaskIds`.
4. Добавить slug в порядок курса в `site/src/data/courses.ts`.
5. Добавлять slug в `readyTheorySlugs` только когда теория и связанные задачи реально готовы.
6. Подключить задачи через `relatedTaskIds` и `section`.
7. Проверить route `/course/<slug>` и canonical route `/courses/oop-cpp/<slug>`.

Не добавлять ручные блоки "Практика" в theory content, если CoursePage уже показывает системный блок "Задачи после темы".

## Как добавить task

1. Добавить entry в `site/src/data/tasks.ts`.
2. Привязать `course` и `section` к существующему section slug.
3. Добавить practice-файл в `practice`, если задача требует starter code.
4. Добавить task id в `relatedTaskIds` нужного section.
5. Проверить `/tasks`, фильтр по section и `/tasks/<task-id>`.

Текст задачи должен быть данными. Layout task detail остаётся в `TaskDetailsPage` и shared components.

## Layout vs Content Data

Layout:

- `CoursePage`
- `LessonContent`
- `TaskDetailsPage`
- shared UI components
- layout shell

Content data:

- theory text in `site/src/content`
- sections in `site/src/data/courseSections.ts`
- course order/readiness in `site/src/data/courses.ts`
- tasks in `site/src/data/tasks.ts`
- practice starter files in `practice`

Если новый раздел требует менять JSX в `CoursePage` или `TaskDetailsPage`, сначала проверь, не нарушен ли content contract.

## Deferred Architecture Tasks

- Page-level `React.lazy` + `Suspense`: отложено до отдельной задачи, где будет выбран единый loading fallback и вручную проверены все основные routes.
- Auth reset без `window.dispatchEvent`: отложено, потому что текущий API-слой очищает auth из fetch flow, а безопасная замена требует отдельного контракта между `lib/api.ts` и `AuthProvider`.
