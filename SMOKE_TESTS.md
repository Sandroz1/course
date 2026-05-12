# SMOKE_TESTS

## Production smoke

```bash
curl -I https://uchicode.ru
curl -I https://www.uchicode.ru
curl -fsS https://api.uchicode.ru/api/health/
```

Ожидаемо:

- `uchicode.ru` отдаёт `200`;
- `www.uchicode.ru` редиректит на `https://uchicode.ru`;
- `/api/health/` возвращает `{"status":"ok","service":"uchicode-api"}`.

## Product сценарии

- Регистрация пользователя.
- Вход и refresh сессии.
- Добавление телефона.
- Отправка и проверка SMS-кода.
- AI недоступен без подтверждённого телефона.
- AI доступен после подтверждения телефона.
- 16-й AI-запрос за день получает `429`.
- Открытие урока сохраняет прогресс.
- Отметка урока и задачи отображается в профиле.
