# 08. Codex/Cursor prompts

## Production-ready проверка перед деплоем

Задача: проверить production-ready состояние проекта Uchicode перед деплоем.

Файлы: весь репозиторий, особенно docker-compose.prod.yml, docker/nginx, backend/config/settings.py, site/src.

Цель: найти ошибки, которые могут сломать production-деплой.

Что сделать:
1. Проверь docker-compose.prod.yml.
2. Убедись, что backend не публикуется наружу и доступен только внутри Docker network.
3. Убедись, что PostgreSQL и Redis не публикуются наружу.
4. Убедись, что Docker nginx публикуется только на 127.0.0.1:8080.
5. Проверь frontend API base URL. В production должно быть /api.
6. Проверь, что endpoint’ы frontend не дают двойной /api/api.
7. Проверь Django production settings и чтение переменных из .env.production.
8. Проверь nginx locations: /api, /api/auth, /api/ai/chat, /admin, /static, /nginx-health.
9. Проверь rate limit. Жёсткий auth_limit не должен применяться к /admin/.
10. Не добавляй зависимости без необходимости.

Проверка:
npm run lint
npm run build
docker compose -f docker-compose.prod.yml config
docker compose -f docker-compose.prod.yml build --pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
curl -fsS http://127.0.0.1:8080/nginx-health
curl -fsS http://127.0.0.1:8080/api/health

Ограничения:
не менять секреты;
не пушить;
не трогать VPS;
не менять .env.production.

## Исправить двойной /api/api

Задача: исправить frontend API paths после production-деплоя.

Контекст:
Сайт работает на https://uchicode.ru.
Backend health работает: /api/health.
Frontend отправляет запросы на /api/api/auth/register/ или /api/api/auth/token/refresh/ и получает 404.
Нужно убрать двойной /api.

Файлы: site/src/lib/api.ts, authApi.ts, progressApi.ts, aiApi.ts, AuthContext.tsx и другие frontend API файлы.

Что сделать:
1. Проверь VITE_API_BASE_URL. По умолчанию должен остаться /api.
2. Найди endpoint’ы, которые начинаются с /api/ при baseURL=/api.
3. Исправь endpoint’ы на пути без второго /api:
/auth/register/
/auth/login/
/auth/token/refresh/
/auth/logout/
/me/
/ai/chat/
4. Не меняй backend, nginx и compose без необходимости.
5. Проверь, что в site/src и site/dist нет строки /api/api.

Проверка:
npm run lint
npm run build
docker compose -f docker-compose.prod.yml build --pull nginx
docker compose -f docker-compose.prod.yml up -d --force-recreate --no-deps nginx
curl -fsS http://127.0.0.1:8080/api/health

Ограничения:
не добавлять зависимости;
не менять .env.production;
не пушить без отдельной команды.

## Исправить 503 в Django admin из-за auth_limit

Задача: исправить 503 Service Temporarily Unavailable в /admin/, вызванный nginx rate limit auth_limit.

Контекст:
В логах nginx есть:
limiting requests, excess ... by zone "auth_limit"
Сейчас /admin/ может отдавать 503 даже при обычном обновлении страницы.
Причина: к /admin/ применён limit_req zone=auth_limit, а rate слишком жёсткий.

Файлы:
docker/nginx/nginx.conf
docker/nginx/conf.d/uchicode.conf

Что сделать:
1. Убери limit_req zone=auth_limit из location /admin/.
2. Не убирай rate limit с /api/auth/, но сделай его разумнее, например rate=30r/m вместо 5r/m.
3. Не трогай /api/health.
4. Не меняй host Nginx config.
5. Не добавляй зависимости.
6. Проверь, что /admin/ больше не содержит limit_req.
7. Проверь, что /api/auth/ всё ещё содержит limit_req.

Проверка:
docker compose -f docker-compose.prod.yml build --pull nginx
docker compose -f docker-compose.prod.yml up -d --force-recreate --no-deps nginx
curl -I http://127.0.0.1:8080/admin/ -H "Host: uchicode.ru"
curl -fsS http://127.0.0.1:8080/api/health

Ожидаемо:
/admin/ без логина возвращает 302 на /admin/login/?next=/admin/.
/api/health возвращает ok JSON.

Ограничения:
не менять backend;
не менять .env.production;
не пушить без отдельной команды.

## Подготовить безопасный release и ручной deploy

Задача: подготовить release commit для ручного деплоя на VPS без автоматического GitHub Actions deploy.

Контекст:
Production работает на VPS 2.26.99.141.
Project path: /opt/uchicode/app.
GitHub Actions может запускаться на push tag v*.
Нужно не запускать автоматический deploy через tag без явного решения.

Что сделать:
1. Проверь git status.
2. Проверь последние commit.
3. Выполни проверки проекта.
4. Если всё ок, сделай commit с понятным сообщением.
5. Запушь main.
6. Не пушь tag v*, если workflow запускает deploy по tag.
7. В результате дай точные команды ручного деплоя на VPS по commit SHA.
8. Дай команды rollback.

Проверка:
npm run lint
npm run build
docker compose -f docker-compose.prod.yml config
docker compose -f docker-compose.prod.yml build --pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
curl -fsS http://127.0.0.1:8080/api/health
docker compose -f docker-compose.prod.yml down

Ограничения:
не трогать VPS;
не менять secrets;
не пушить tag без отдельной команды;
не force push.

## Улучшить AI UX при пустом QWEN_API_KEY

Задача: сделать поведение AI-помощника корректным, если production QWEN_API_KEY не задан.

Контекст:
На production /api/ai/chat/ отдаёт 503 и UI показывает ошибку "AI-сервис временно не настроен".
Это ожидаемо, потому что QWEN_API_KEY пустой.
Нужно улучшить UX, не ломая backend.

Файлы: frontend компоненты AI-помощника и API-клиент AI.

Что сделать:
1. Найди компонент AI-помощника.
2. Проверь, как отображается ошибка 503.
3. Сделай понятное сообщение для пользователя.
4. Не выводи технические детали.
5. Если есть feature flag/env для AI — используй его. Если нет — предложи минимальный вариант без лишней архитектуры.
6. Не меняй backend без необходимости.

Проверка:
npm run lint
npm run build

Ограничения:
не добавлять зависимости;
не менять .env.production;
не удалять AI-код полностью без отдельного решения.
