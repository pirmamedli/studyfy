# Подключение Supabase

Studyfy — клиент-only PWA: браузер общается с Supabase напрямую (Supabase Auth +
одна таблица с Row Level Security). Без переменных окружения приложение работает
в local-first режиме (прогресс только в браузере). С ними — вход по email/паролю
и синхронизация прогресса между устройствами.

## 1. Создай проект Supabase

1. Зайди на [supabase.com](https://supabase.com) → **New project**.
2. Задай имя и **надёжный пароль базы** (он не нужен приложению, только для БД).
3. Дождись, пока проект развернётся (~1–2 минуты).

## 2. Применни схему

1. В проекте открой **SQL Editor** → **New query**.
2. Скопируй туда всё содержимое [`supabase/schema.sql`](supabase/schema.sql) и нажми **Run**.
   - Создаётся таблица `public.studyfy_state` (одна строка на пользователя, поле `state` — весь прогресс в jsonb).
   - Включается **RLS**: каждый видит и меняет только свою строку.

## 3. Настрой Auth (email + пароль)

1. **Authentication → Providers → Email** — включён по умолчанию.
2. Для мгновенного входа при разработке можно выключить подтверждение почты:
   **Authentication → Providers → Email → «Confirm email» → Off**.
   Если оставить включённым — после регистрации нужно перейти по ссылке из письма, затем войти.
3. **Authentication → URL Configuration → Site URL** — укажи адрес приложения
   (для локали `http://localhost:5178`, для прод — домен на Vercel/хостинге).

## 4. Возьми ключи и создай `.env.local`

**Project Settings → API**:

- **Project URL** → `VITE_SUPABASE_URL`
- **Project API keys → anon public** → `VITE_SUPABASE_ANON_KEY`

Создай в корне проекта файл `.env.local` (он в `.gitignore`, в репозиторий не попадёт):

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...ваш-anon-key...
```

Шаблон — в [`.env.example`](.env.example).

## 5. Запусти

```bash
export PATH="$HOME/.local/node/bin:$PATH"
npm run dev
```

Теперь на экране входа — регистрация/вход по email и паролю. После входа прогресс
подтягивается из Supabase, а изменения сохраняются автоматически (с задержкой ~1 с).

## CLI-работа

Supabase CLI установлен как dev-зависимость проекта. Перед командами убедись,
что локальный Node доступен в `PATH`:

```bash
export PATH="$HOME/.local/node/bin:$PATH"
```

Основные команды:

```bash
npm run supabase:login      # вход в Supabase CLI
npm run supabase:link       # привязка к проекту Supabase
npm run supabase:db:push    # применить миграции к удалённой базе
npm run supabase:db:pull    # подтянуть схему из удалённой базы
npm run supabase:status     # статус локального Supabase
npm run supabase:start      # локальный Supabase (нужен Docker)
```

Текущая схема лежит в миграции
`supabase/migrations/20260720175500_initial_studyfy_state.sql`.
Файл `supabase/schema.sql` оставлен как читаемая копия схемы для SQL Editor.

## Как это устроено в коде

- `src/lib/supabase.ts` — клиент; `isSupabaseEnabled` = заданы ли переменные.
- `src/data/remote.ts` — загрузка/сохранение/удаление строки состояния.
- `src/state/AppProvider.tsx` — отслеживает сессию, при входе гидрирует состояние
  из облака (и применяет дневную логику: серия, жизни, фокус), сохраняет изменения
  с дебаунсом; локальный `localStorage` остаётся офлайн-кэшем.
- Без Supabase — прежний вход по коду доступа и хранение только в браузере.

## Безопасность

- Используется **только anon-ключ** (он публичный, его можно светить во фронте).
- Доступ к данным ограничен политиками RLS: `auth.uid() = user_id`.
- Полное удаление аккаунта из клиента стирает строку прогресса и завершает сессию;
  удаление самой учётной записи `auth.users` требует сервисного ключа на бэкенде
  (для клиент-only это делается через Supabase Dashboard или Edge Function).
