# Архитектура — CV-генератор + трекер откликов

Полное описание кодовой базы для навигации и дальнейшей разработки.

## 1. Обзор

Приложение решает две задачи:

1. **Генерация CV** — пользователь вводит опыт (или вакансию), LLM адаптирует текст
   под вакансию, сервер собирает DOCX (порт python-шаблона `generate.py` из
   `../vacancySearch`).
2. **Трекер откликов** — CRM для рассылки CV: воронка этапов, таймлайн, заметки,
   сравнение оферов.

Стек: Next.js 16 (App Router + Turbopack), TypeScript strict, Tailwind v4, shadcn/ui
(style `radix-maia`, base `mist`), react-hook-form + zod, `docx`, NextAuth v5
(credentials + JWT), Mongoose (MongoDB Atlas), bcryptjs, next-themes, lucide-react.

## 2. Структура каталогов

```
app/
  layout.tsx                      # root layout: fonts, SessionProvider, ThemeProvider, TooltipProvider, Toaster
  (marketing)/                    # публичная часть (без sidebar)
    layout.tsx                    # SiteHeader
    page.tsx                      # лендинг + анонимный генератор
    login/page.tsx, register/page.tsx
  (app)/                          # личный кабинет (sidebar)
    layout.tsx                    # AppShell (SidebarProvider + SidebarInset)
    dashboard/page.tsx
    applications/page.tsx, new/page.tsx, [id]/page.tsx
    offers/page.tsx
    contacts/page.tsx             # адресная книга
    settings/{layout.tsx, keys,profile,pipeline}/page.tsx
  api/
    auth/[...nextauth]/route.ts
    register/route.ts
    generate/route.ts, generated-cvs/[id]/download/route.ts
    keys/route.ts, keys/[id]/route.ts
    profiles/route.ts, profiles/[id]/route.ts, profiles/import/route.ts
    stages/route.ts
    applications/route.ts, applications/[id]/route.ts
    contacts/route.ts, contacts/[id]/route.ts
    interviews/route.ts, interviews/[id]/route.ts
    push/subscribe/route.ts, cron/reminders/route.ts
components/
  ui/                             # shadcn-компоненты (incl. sidebar, avatar, dropdown, dialog, sheet, popover, tooltip, sonner, table, tabs, calendar, progress)
  app/                            # app-sidebar.tsx, app-shell.tsx
  form/                           # cv-form, fields, mode-selector, disclaimer-dialog, steps/*
  generator.tsx
  applications/                   # applications-board, pipeline-board, application-card, application-detail, activity-timeline, company-logo, stage-badge, contact-picker, interview-dialog, send-dialog, response-dialog, application-form, types.ts
  dashboard/                      # dashboard-stats, metric-card, funnel-chart
  offers/offers-table.tsx
  contacts/contacts-manager.tsx
  settings/, auth/, notifications/, theme-provider.tsx, site-header.tsx
lib/
  auth.ts, auth.config.ts, db.ts, schemas.ts, api-schemas.ts, llm.ts, providers.ts,
  resolve-provider.ts, encryption.ts, vacancy.ts, docx.ts, pipeline.ts,
  profile-import.ts, web-push.ts, utils.ts, format.ts, application-serialize.ts
  models/                         # user, api-key, profile, generated-cv, pipeline-stage, application, contact, interview, push-subscription
proxy.ts                          # защита маршрутов (замена middleware.ts в Next 16)
types/next-auth.d.ts
docs/
```

## 3. Модель данных (MongoDB / Mongoose)

Все коллекции привязаны к пользователю через `userId` (строка — id из JWT-сессии).
Проверка владельца (`userId`) выполняется в каждом роуте.

| Коллекция | Поля |
|---|---|
| `users` | `email` (unique, lowercase), `passwordHash` (bcrypt), `name`, timestamps |
| `apikeys` | `userId`, `provider`, `label`, `baseUrl`, `modelName`, `apiKeyEnc` (AES), `keyHint` (последние 4 символа), `isDefault` |
| `profiles` | `userId`, `label`, `data` (CvFormValues, Mixed), `isDefault` |
| `generatedcvs` | `userId`, `applicationId?`, `profileId?`, `adaptedCv` (AdaptedCv), `inputSnapshot` (CvFormValues), `lang` |
| `pipelinestages` | `userId`, `name`, `order`, `color`, `type` (`start`/`active`/`terminal`), `terminalResult?` (`rejected`/`no-response`/`accepted`) |
| `applications` | `userId`, `company`, `role`, `companyDomain?`, `country?`, `salaryMin/Max?`, `currency?`, `sourceType?`, `sourceUrl?`, `vacancyText?`, `cvId?`, `stageId`, `timeline[]` (activity-log: `{at, type, stageId?, stageName?, note?}`), `contactIds[]`, `notes?`, `sentChannel?`, `sentTo?`, `sentAt?`, `offerSalary?`, `offerCurrency?`, `offerBenefits?`, `offerRemote?`, `archived` |
| `contacts` | `userId`, `name`, `email?`, `phone?`, `linkedin?`, `company?`, `role?`, `notes?`, timestamps |
| `interviews` | `userId`, `applicationId`, `type` (`screen`/`technical`/`final`/`assignment`/`custom`), `scheduledAt`, `channel?`, `note?`, `status` (`scheduled`/`done`/`cancelled`), timestamps |
| `pushsubscriptions` | `userId`, `endpoint` (unique), `keys.p256dh`, `keys.auth` |

> **Важно:** в моделях Mongoose нельзя использовать имя поля `model` — конфликтует с
> встроенным методом документа. В `ApiKey` поле называется `modelName` (наружу — `model`).

`CvFormValues` (форма CV) — см. `lib/schemas.ts`: `personal`, `skills[]`
(`name`+`level`), `experience[]` (с `bullets[]` из `{value}`), `education[]`,
`projects[]`, `languages[]`, `vacancy?` (`source: text|url`, `text`, `url`).

## 4. LLM-слой

### Провайдеры (`lib/providers.ts`)

Каталог `PROVIDERS`: DeepSeek (`api.deepseek.com`), OpenAI (`api.openai.com/v1`),
OpenRouter (`openrouter.ai/api/v1`), «свой endpoint». Все — OpenAI-совместимые
(`POST {baseUrl}/chat/completions`, `Authorization: Bearer`).

### Резолв ключа (`lib/resolve-provider.ts`)

`resolveProvider(userId?)`:
1. `userId` задан → дефолтный `ApiKey` пользователя (расшифровка AES).
2. Иначе → серверный `DEEPSEEK_API_KEY` (модель `deepseek-chat`).

### Генерация (`lib/llm.ts`)

`generateCv(input, provider)` → `AdaptedCv`. Промпты для 3 режимов
(`with_experience` / `junior` / `generate_experience`) + правила честности и
senior-стиля. Ответ — строгий JSON (валидируется `adaptedCvSchema`), поле `lang`
задаётся по языку вакансии.

**Контракт `AdaptedCv`** (совпадает со spec-файлами python-проекта):

```ts
{
  lang: "ru" | "en",
  name: string,
  title_line: string,          // "Senior Full Stack Developer (React / TypeScript)"
  header_note?: string,        // "React · TypeScript · 4+ года"
  contacts: string[],          // уже отформатированные строки
  sections: Array<
    | { type: "paragraph", heading, lines: string[] }
    | { type: "bullets", heading, items: string[] }
    | { type: "experience", heading, items: ExperienceItem[] }
    | { type: "projects", heading, items: ProjectItem[] }
  >
}
```

### DOCX (`lib/docx.ts`)

`buildDocx(cv)` → `Buffer`. Верный порт `generate.py`: Calibri, имя 20pt bold
#1F3B63, title_line, header_note, контакты через ` | `, заголовки 12pt bold +
нижняя линия, секции **О себе → Навыки → Опыт → Проекты → Образование → Языки**,
буллеты, блок опыта с `Технологии: ...` (9.5pt italic серый).

## 5. API

| Метод/путь | Auth | Описание |
|---|---|---|
| `POST /api/register` | — | Регистрация (email, password ≥ 8, name?) → 201 / 409 дубликат |
| `*/api/auth/[...nextauth]` | — | NextAuth (credentials) |
| `POST /api/generate` | опц. | Тело: `CvFormValues + mode + disclaimerAccepted + save? + applicationId? + profileId?`. Возвращает DOCX. При `save` + авторизации сохраняет `GeneratedCv` и привязывает к отклику |
| `GET /api/generated-cvs/:id/download` | да | DOCX из сохранённого `AdaptedCv` |
| `GET/POST /api/keys` | да | Список (маскированные) / создание (шифрование) |
| `PATCH/DELETE /api/keys/:id` | да | Обновление / удаление (промоут следующего дефолтного) |
| `GET/POST /api/profiles` | да | Список (с данными) / создание |
| `POST /api/profiles/import` | да | Импорт `profile.yaml`/JSON (`{label, raw}`) → маппинг в `CvFormValues` → создание профиля |
| `PATCH/DELETE /api/profiles/:id` | да | Переименование / default / удаление |
| `GET /api/stages` | да | Список этапов (авто-сид дефолтных) |
| `PUT /api/stages` | да | Полная замена воронки (`{stages:[...]}`), удалённые этапы переносят отклики на «Старт» |
| `GET/POST /api/applications` | да | Список (`?search=`, `?archived=1`) / создание (авто-этап «Старт») |
| `GET/PATCH/DELETE /api/applications/:id` | да | Детали / обновление (смена этапа → activity `stage_change` + авто `sentAt` на «Отправлено»; `activity` → запись в таймлайн) / удаление |
| `GET/POST /api/contacts` | да | Адресная книга (с `applicationCount`) / создание |
| `PATCH/DELETE /api/contacts/:id` | да | Обновление / удаление (снимает связь с откликами) |
| `GET/POST /api/interviews` | да | Список событий (`?applicationId=`, с `company`/`role` отклика) / создание |
| `PATCH/DELETE /api/interviews/:id` | да | Обновление (тип/дата/канал/статус) / удаление |
| `POST/DELETE /api/push/subscribe` | да | Сохранение/удаление подписки web-push (`{endpoint, keys}`) |
| `GET /api/cron/reminders` | cron | Напоминания за ≤1ч до события (auth: `Bearer CRON_SECRET`) |

Общий паттерн роутов: `const userId = await getUserId()` → 401 при отсутствии;
`await connectDb()`; zod-валидация; проверка владельца в запросе.

## 6. Основные флоу

### Авторизация
1. `POST /api/register` → bcrypt-хеш → `users`.
2. `signIn("credentials", ...)` (клиент) → `authorize` в `lib/auth.ts` ищет юзера,
   сверяет bcrypt, возвращает `{id, email, name}` → JWT (`token.sub` = id).
3. `session.user.id` = `token.sub` (расширение типов в `types/next-auth.d.ts`).
4. `proxy.ts` защищает `/dashboard`, `/applications`, `/offers`, `/settings` через
   `authorized` (неимпорт mongoose в edge — для этого `auth.config.ts`).

### Генерация CV
1. `Generator` → блок **«Есть вакансия?»** (ссылка/текст, опционально) → `ModeSelector`
   → (дисклеймер для generate_experience) → `CvForm`.
2. `CvForm` собирает `CvFormValues` (шаг «Вакансия» префиллен из блока), на submit →
   `POST /api/generate`.
3. Роут: валидация → (вакансия URL → `fetchVacancyText`, при блокировке 422) →
   `resolveProvider` → `generateCv` → опц. сохранение → `buildDocx` → файл.
4. Клиент скачивает blob; авторизованному предлагается «Сохранить как профиль».

### Трекинг отклика
1. `/applications/new` → `POST /api/applications` (этап «Старт»).
2. `/applications` — kanban (drag-and-drop → `PATCH stageId`) + сортировка
   **«Воронка» / «События» (ближайшие) / «Недавние»**, полоса «Скоро» и бейджи
   предстоящих событий.
3. `/applications/[id]` — смена этапа (таймлайн), заметки, контакты, офер,
   генерация CV с привязкой (`save:true, applicationId`).
4. **Фиксация отправки** — блок «Отправка CV»: канал, «кому», «когда» → пишет
   `sentChannel`/`sentTo`/`sentAt` и двигает на «Отправлено».
5. **Ответ и созвон** — «Записать ответ» (`respondedAt`+`responseChannel`, авто-этап
   «Ответ (HR)») и «Назначить событие» (`nextEventType/At/Channel/Note`, авто-переход
   на выбранный этап), счётчик «через N дн/ч».
6. `/offers` — фильтр этапов «Офер»/«Принято» и сравнение по ЗП.

### Уведомления (web-push)
- Подписка: `POST /api/push/subscribe`, service worker `public/sw.js`, кнопка
  «Включить уведомления» на дашборде.
- Напоминания: Vercel Cron (`vercel.json`) → `GET /api/cron/reminders` (auth
  `CRON_SECRET`) раз в час шлёт push за события, до которых ≤1ч.

## 7. Как что-то добавить/поменять

- **Новый LLM-провайдер** — добавить в `PROVIDERS` (`lib/providers.ts`). Всё
  OpenAI-совместимое работает без правок.
- **Новый этап воронки** — в UI `/settings/pipeline`, либо в `DEFAULT_STAGES`
  (`lib/pipeline.ts`).
- **Новое поле отклика** — `lib/models/application.ts` + `applicationUpdateSchema`
  (`lib/api-schemas.ts`) + PATCH в `app/api/applications/[id]/route.ts` + UI.
- **Новый шаг формы CV** — `lib/schemas.ts` → `components/form/steps/*` → добавить
  в `ALL_STEPS` (`cv-form.tsx`). Поле `bullets` — массив `{value}` (объект, т.к.
  `useFieldArray` не поддерживает массивы примитивов в этой версии react-hook-form).

## 8. Известные ограничения / TODO

- Rate limit на `/api/generate` не реализован (в роадмапе).
- Нативная поддержка Anthropic/Gemini отсутствует (только через OpenRouter).
- Воркер с рассылкой по расписанию не делали — трекинг ручной.
