# REDESIGN-PLAN — перестройка UI и логики продвижения откликов

Цель: убрать «стены» контента на одном экране, сделать логичное продвижение по
воронке и переиспользуемые shadcn-компоненты, как у Huntr/Teal.

## Зафиксированные решения

1. **Контакты** — отдельная сущность, общая адресная книга (`contacts`),
   many-to-many с откликами (`application.contactIds[]`).
2. **Логотипы компаний** — favicon-сервис Google
   (`https://www.google.com/s2/favicons?domain=…`), без загрузки файлов.
3. **Собеседования** — отдельная сущность (`interviews`), показываются в карточке
   отклика и на дашборде; глобальный «Календарь» в меню не добавляется (можно позже).
4. **Миграция** — одноразовый скрипт (`scripts/migrate.ts`) + обратная совместимость
   сериализации на переходный период.

## Стек (дополнения)

Добавляются shadcn-компоненты: `sidebar`, `avatar`, `dropdown-menu`, `tooltip`,
`sheet`, `popover`, `sonner`, `calendar`, `table`, `progress`. Всё остальное — без
изменений (Next.js 16, TS strict, Tailwind v4, Mongoose, NextAuth v5).

## Модель данных

- **Новое** `Contact`: `userId, name, email, phone?, linkedin?, company?, role?,
  notes?, timestamps`.
- **Новое** `Interview`: `userId, applicationId, type
  (screen|technical|final|assignment|custom), scheduledAt, channel?, note?, status
  (scheduled|done|cancelled), timestamps`.
- **Рефактор** `Application`: удалить `contactName/contactEmail`,
  `nextEventType/At/Channel/Note`, `respondedAt/responseChannel`; добавить
  `contactIds[]`, `companyDomain`; `timeline` → activity-log с `type` и `stageId`.

## IA (sidebar)

- Навигация: Дашборд `/dashboard`, Отклики `/applications`, Оферы `/offers`.
- Люди: Контакты `/contacts` (новый).
- Настройки: Профиль `/settings/profile`, API-ключи `/settings/keys`,
  Воронка `/settings/pipeline`.

## Экраны

- **Дашборд**: визуальная воронка, «ближайшие события», «застрявшие», метрики
  (response rate, интервью-рейт, среднее время до ответа).
- **Отклики**: kanban с «возрастом в этапе», логотипом, бейджами; терминальные
  этапы отдельным блоком; без сырого `<select>`.
- **Карточка отклика**: вкладки Обзор / Таймлайн / Контакты / События / Заметки / CV.
- **Оферы**: сравнение + подсветка лучшего + статус офера.
- **Контакты**: адресная книга.

## API

- Новые: `GET/POST /api/contacts`, `PATCH/DELETE /api/contacts/:id`;
  `GET/POST /api/interviews`, `PATCH/DELETE /api/interviews/:id`.
- Обновить `/api/applications` (сериализация: `contactIds`, `companyDomain`,
  `timeInStage`), `/api/applications/:id` (activity-log вместо молчаливого
  перевода этапа), `/api/cron/reminders` (ключ от `interviews.scheduledAt`).

## Фазы

0. Каркас: shadcn-компоненты + `app-shell`/sidebar.
1. Модель и API: `Contact`, `Interview`, рефактор `Application`, роуты, миграция.
2. Отклики: kanban + карточка на вкладках.
3. Дашборд, оферы, контакты.
4. Полировка: тосты, empty-states, скелетоны, typecheck/lint/build.
