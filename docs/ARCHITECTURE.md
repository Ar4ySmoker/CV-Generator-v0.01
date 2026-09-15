# Архитектура — CV-генератор + трекер откликов + команды

Полное описание кодовой базы для навигации и дальнейшей разработки.

## 1. Обзор

Приложение решает четыре задачи:

1. **Генерация CV** — пользователь вводит опыт (или вакансию), LLM адаптирует текст
   под вакансию, сервер собирает DOCX (порт python-шаблона `generate.py` из
   `../vacancySearch`). Есть шаблоны оформления и импорт готового PDF/DOCX.
2. **Трекер откликов** — CRM для рассылки CV: воронка этапов, таймлайн, заметки,
   контакты, собеседования, сравнение оферов.
3. **Каталог и поиск вакансий** — глобальный каталог + живой поиск по внешним
   источникам (hh.ru, Хабр Карьера, Remote OK, Работа России, Jooble) + Telegram-лента.
4. **Команды** — общий опыт: доска вакансий по компаниям, таймлайны участников,
   отзывы о собеседованиях, чат, роли (владелец/участник/ментор/ревьюер).

Стек: Next.js 16 (App Router + Turbopack), TypeScript strict, Tailwind v4, shadcn/ui
(style `radix-maia`, base `mist`), react-hook-form + zod, `docx`, `cheerio`, NextAuth v5
(credentials + JWT), Mongoose (MongoDB Atlas), bcryptjs, next-themes, lucide-react,
Vitest (тесты).

## 2. Структура каталогов

```
app/
  layout.tsx                      # root layout: fonts, SessionProvider, ThemeProvider, TooltipProvider, Toaster
  (marketing)/                    # публичная часть (SiteHeader)
    layout.tsx, page.tsx          # лендинг + анонимный генератор
    login/page.tsx, register/page.tsx
  (app)/                          # личный кабинет (sidebar)
    layout.tsx                    # AppShell (SidebarProvider + SidebarInset)
    dashboard/, vacancies/, telegram/, applications/{page,new,[id]}, offers/, contacts/, teams/{page,[id]/...}, settings/{keys,profile,pipeline,notifications}
  api/
    auth/[...nextauth], register
    generate, generated-cvs/[id]/download, cv-import
    keys, keys/[id]
    profiles, profiles/[id], profiles/import
    stages
    applications, applications/[id]
    contacts, contacts/[id]
    interviews, interviews/[id]
    push/subscribe, push/test, notifications/settings, cron/reminders
    users/search
    teams/, teams/join, teams/discover, teams/[id]/... (members, requests, invite, vacancies, activity, feedback, companies/[companyKey], messages)
    vacancies/, vacancies/[id], vacancies/[id]/{apply,status}, vacancies/import, vacancies/search
    telegram/channels, telegram/channels/[id], telegram/feed
components/
  ui/                             # shadcn-компоненты
  app/                            # app-sidebar.tsx, app-shell.tsx
  form/                           # cv-form, template-picker, mode-selector, disclaimer-dialog, steps/*
  generator.tsx
  applications/                   # applications-board, pipeline-board, application-card, application-detail, activity-timeline, company-logo, stage-badge, contact-picker, cv-import, send/response/interview-dialog, application-form, types.ts
  dashboard/, offers/, contacts/
  settings/                       # settings-nav, profiles-manager, keys-*, pipeline-*, notifications-settings
  notifications/                  # use-push.ts, enable-notifications.tsx
  vacancies/                      # vacancies-board.tsx, vacancy-search.tsx, types.ts
  telegram/telegram-feed.tsx
  teams/                          # teams-manager, team-detail, vacancy-board, activity-feed, company-detail, company-shared, discover, types
  auth/, theme-provider.tsx, site-header.tsx, registration-cta.tsx
lib/
  auth.ts, auth.config.ts, admin.ts, db.ts, encryption.ts
  schemas.ts, api-schemas.ts
  llm.ts, providers.ts, resolve-provider.ts
  vacancy.ts (fetchVacancyText), cv-import.ts (PDF/DOCX), docx.ts, cv-templates.ts
  pipeline.ts, profile-import.ts, web-push.ts
  utils.ts, format.ts, application-serialize.ts, vacancy-serialize.ts, vacancy-apply.ts, stage-outcome.ts
  team.ts, telegram-feed.ts
  vacancy-sources/               # types, index, hh, habr, remoteok, trudvsem, jooble
  models/                        # см. раздел 3
proxy.ts                          # защита маршрутов (замена middleware.ts в Next 16)
types/next-auth.d.ts
docs/
scripts/migrate-teams.mjs
```

## 3. Модель данных (MongoDB / Mongoose)

Почти все коллекции привязаны к пользователю через `userId` (id из JWT-сессии);
проверка владельца выполняется в каждом роуте. Глобальные сущности (вакансии,
Telegram-каналы) — общие.

| Коллекция | Поля |
|---|---|
| `users` | `email` (unique, lowercase), `passwordHash` (bcrypt), `name` |
| `apikeys` | `userId`, `provider`, `label`, `baseUrl`, `modelName`, `apiKeyEnc` (AES), `keyHint`, `isDefault` |
| `profiles` | `userId`, `label`, `data` (CvFormValues), `isDefault` |
| `generatedcvs` | `userId`, `applicationId?`, `profileId?`, `adaptedCv`, `inputSnapshot`, `lang`, `source` (`generated`/`import`), `templateId?`, `accentColor?` |
| `pipelinestages` | `userId`, `name`, `order`, `color`, `type` (`start`/`active`/`terminal`), `terminalResult?` |
| `applications` | `userId`, `company`, `role`, `companyDomain?`, `country?`, `salaryMin/Max?`, `currency?`, `sourceType?`, `sourceUrl?`, `vacancyText?`, `cvId?`, `stageId`, `timeline[]`, `contactIds[]`, `notes?`, `sentChannel?/sentTo?/sentAt?`, `offerSalary?/offerCurrency?/offerBenefits?/offerRemote?`, `visibility` (`private`/`team`), `shareSalary`, `shareNotes`, `archived` |
| `contacts` | `userId`, `name`, `email?`, `phone?`, `telegram?`, `linkedin?`, `company?`, `role?`, `notes?` |
| `interviews` | `userId`, `applicationId`, `type`, `scheduledAt`, `channel?`, `note?`, `status` (`scheduled`/`done`/`cancelled`), `reminderSentAt?` |
| `pushsubscriptions` | `userId`, `endpoint` (unique), `keys.p256dh`, `keys.auth` |
| `notificationsettings` | `userId` (unique), `enabled`, `interviewReminders`, `reminderLeadMinutes` |
| `teams` | `name`, `description?`, `tags[]`, `domain?`, `visibility` (`public`/`private`), `joinMode` (`open`/`request`), `inviteCode` (unique) |
| `teammemberships` | `userId`, `teamId`, `role` (`owner`/`member`/`mentor`/`reviewer`), `status` (`active`/`invited`/`requested`), unique(`userId`,`teamId`) |
| `teamactivities` | `teamId`, `type` (`shared`/`feedback`/`stage`), `actorId`, `applicationId?`, `company?`, `role?`, `stageName?`, `feedbackKind?` |
| `teammessages` | `teamId`, `companyKey`, `authorId`, `text` |
| `vacancyfeedbacks` | `teamId`, `companyKey`, `authorId`, `kind` (`questions`/`tips`/`general`), `rating?`, `text` |
| `vacancies` | `company`, `role`, `country?`, `salaryMin/Max?`, `currency?`, `sourceUrl?`, `sourceType?`, `description?`, `tags[]`, `source` (`manual`/`shared`), `teamId?`, `sharedById?`, `createdById` |
| `vacancystatuses` | `userId`, `vacancyId`, `status` (`saved`/`applied`/`skipped`), `applicationId?`, unique(`userId`,`vacancyId`) |
| `telegramchannels` | `username` (unique), `createdBy` |

> **Важно:** в моделях Mongoose нельзя использовать имя поля `model` — конфликтует с
> встроенным методом документа. В `ApiKey` поле называется `modelName`.

`CvFormValues` — см. `lib/schemas.ts`: `personal`, `skills[]` (`name`+`level`),
`experience[]` (с `bullets[]` из `{value}`), `education[]`, `projects[]`, `languages[]`,
`vacancy?`.

## 4. LLM-слой

### Провайдеры (`lib/providers.ts`)

Каталог `PROVIDERS`: DeepSeek, OpenAI, OpenRouter, «свой endpoint». Все —
OpenAI-совместимые (`POST {baseUrl}/chat/completions`).

### Резолв ключа (`lib/resolve-provider.ts`)

`resolveProvider(userId?)`: дефолтный `ApiKey` пользователя → иначе серверный
`DEEPSEEK_API_KEY`.

### Генерация (`lib/llm.ts`)

`generateCv(input, provider)` → `AdaptedCv` (3 режима + правила честности/senior-стиля).
`parseCvFromText(text, provider)` → `{ adaptedCv, form }` — честный разбор готового CV
(используется при импорте PDF/DOCX). Ответы валидируются zod-схемами.

**Контракт `AdaptedCv`**: `{ lang, name, title_line, header_note?, contacts[],
sections[] }`, где `sections` — discriminated union (`paragraph`/`bullets`/`experience`/`projects`).

### DOCX (`lib/docx.ts` + `lib/cv-templates.ts`)

`buildDocx(cv, { template, accentColor })` → `Buffer`. Шаблоны: `classic` (подчёркнутые
заголовки), `modern` (левая акцентная полоса + линия под шапкой), `minimal`
(монохром). Цвет акцента переопределяется.

### Импорт CV (`lib/cv-import.ts`)

`detectFileType` + `extractText` (mammoth для DOCX, unpdf для PDF), далее
`parseCvFromText` → `GeneratedCv` (`source: "import"`).

## 5. API

Все `/api/*` (кроме `register`, `auth`, `generate` — опционально) требуют авторизацию.
Паттерн роута: получить `userId` (через `getUserId` или `auth`) → 401, `connectDb()`,
zod-валидация, проверка владельца/прав.

### Auth и генерация
| Метод/путь | Описание |
|---|---|
| `POST /api/register` | Регистрация (email, password ≥ 8, name?) |
| `*/api/auth/[...nextauth]` | NextAuth (credentials) |
| `POST /api/generate` | `CvFormValues + mode + disclaimerAccepted + save? + templateId? + accentColor? + applicationId?/profileId?` → DOCX (опц. сохранение + привязка) |
| `GET /api/generated-cvs/:id/download` | DOCX из сохранённого `AdaptedCv` (с шаблоном/цветом) |
| `POST /api/cv-import` | multipart (PDF/DOCX) + `applicationId?` → разбор и сохранение как `GeneratedCv` |

### Ключи, профили, воронка
| Метод/путь | Описание |
|---|---|
| `GET/POST /api/keys`, `PATCH/DELETE /api/keys/:id` | API-ключи (шифрование, маскирование) |
| `GET/POST /api/profiles`, `POST /api/profiles/import`, `PATCH/DELETE /api/profiles/:id` | Профили (мастер-данные CV, импорт yaml/json) |
| `GET /api/stages`, `PUT /api/stages` | Этапы воронки (авто-сид + полная замена) |

### Отклики, контакты, собеседования
| Метод/путь | Описание |
|---|---|
| `GET/POST /api/applications` (`?search=`, `?archived=1`) | Список / создание |
| `GET/PATCH/DELETE /api/applications/:id` | Детали / обновление (смена этапа → таймлайн + activity команды; шаринг → upsert `Vacancy`) / удаление |
| `GET/POST /api/contacts`, `PATCH/DELETE /api/contacts/:id` | Адресная книга |
| `GET/POST /api/interviews`, `PATCH/DELETE /api/interviews/:id` | События |

### Уведомления
| Метод/путь | Описание |
|---|---|
| `POST/DELETE /api/push/subscribe` | Подписка web-push |
| `GET/PATCH /api/notifications/settings` | Настройки (`enabled`, `interviewReminders`, `reminderLeadMinutes`) |
| `POST /api/push/test` | Тестовое уведомление |
| `GET /api/cron/reminders` | Cron: напоминания с учётом настроек, дедупликация (`reminderSentAt`), чистка невалидных подписок |

### Команды
| Метод/путь | Описание |
|---|---|
| `GET/POST /api/teams` | Мои команды (с ролью) / создание |
| `POST /api/teams/join` | Вступить по инвайт-коду |
| `GET /api/teams/discover` (`?q=&domain=`) | Каталог публичных команд |
| `GET/PATCH/DELETE /api/teams/:id` | Детали + участники / настройки / удаление |
| `POST /api/teams/:id/invite` | Новый код приглашения |
| `POST /api/teams/:id/members`, `PATCH/DELETE /api/teams/:id/members/:memberId` | Пригласить по userId / смена роли / исключить |
| `POST/GET /api/teams/:id/requests`, `PATCH /api/teams/:id/requests/:requestId` | Заявки на вступление / одобрение-отклонение |
| `GET /api/teams/:id/vacancies` | Доска: вакансии по компаниям (участники, этапы, исходы, фидбек) |
| `GET /api/teams/:id/activity` | Лента активности команды |
| `POST /api/teams/:id/feedback`, `PATCH/DELETE /api/teams/:id/feedback/:feedbackId` | Отзывы о собеседовании (создание/редактирование/удаление) |
| `GET /api/teams/:id/companies/:companyKey` | Досье компании: вакансия, участники с таймлайнами, фидбек |
| `GET/POST /api/teams/:id/companies/:companyKey/messages`, `PATCH/DELETE .../messages/:messageId` | Чат по вакансии |

### Люди
| Метод/путь | Описание |
|---|---|
| `GET /api/users/search?q=` | Поиск людей (имя/email) для приглашений |

### Вакансии (каталог)
| Метод/путь | Описание |
|---|---|
| `GET/POST /api/vacancies` (`?q=&source=&status=`) | Каталог (+ мой статус) / создать (авто-fetch по URL) |
| `GET/PATCH/DELETE /api/vacancies/:id` | Деталь / редактирование (автор) / удаление |
| `POST /api/vacancies/:id/status` | Статус `saved`/`applied`/`skipped` |
| `POST /api/vacancies/:id/apply` | Конвертация в отклик (создаёт `Application`) |
| `POST /api/vacancies/import` | Сохранить (+ опц. `apply`) из внешнего результата поиска |
| `GET /api/vacancies/search` (`?q=&remote=1&source=`) | Живой поиск по источникам |

### Telegram
| Метод/путь | Описание |
|---|---|
| `GET/POST /api/telegram/channels`, `DELETE /api/telegram/channels/:id` | Каналы (мутации — только админ) |
| `GET /api/telegram/feed` (`?refresh=1`) | Лента постов из каналов |

## 6. Источники вакансий (`lib/vacancy-sources/`)

Единый интерфейс `VacancySourceProvider.search(q, { remote, sources })` →
`SourceVacancy`. Агрегатор `searchVacancies` дёргает источники через
`Promise.allSettled` (недоступный источник не роняет поиск).

| Источник | Рус. | Remote | Ключ |
|---|---|---|---|
| `hh.ts` — hh.ru API | ✅ | ✅ | нет (блокирует IP Vercel) |
| `habr.ts` — Хабр Карьера | ✅ | ✅ | нет |
| `remoteok.ts` — Remote OK | ❌ | ✅ (все) | нет |
| `trudvsem.ts` — Работа России | ✅ | эвристика | нет |
| `jooble.ts` — Jooble | ✅ | — | `JOOBLE_API_KEY` (опц.) |

Telegram-лента (`lib/telegram-feed.ts`) парсит публичное веб-превью `t.me/s/<channel>`
через `cheerio`; каналы управляются админом (`lib/admin.ts`, `ADMIN_EMAILS`).

## 7. Основные флоу

### Авторизация
`POST /api/register` → bcrypt → `users`; `signIn("credentials")` → `authorize` →
JWT (`token.sub` = id) → `session.user.id`. `proxy.ts` защищает `/dashboard`,
`/vacancies`, `/telegram`, `/applications`, `/offers`, `/contacts`, `/teams`,
`/settings` (через `auth.config.ts`).

### Генерация CV
`Generator` → вакансия (ссылка/текст) → `ModeSelector` → (дисклеймер) → `CvForm`
(шаблон + цвет на последнем шаге) → `POST /api/generate` → `resolveProvider` →
`generateCv` → опц. сохранение → `buildDocx` → файл.

### Трекинг отклика
`/applications/new` → `POST /api/applications` (этап «Черновик»); kanban
(drag-and-drop → `PATCH stageId`), сортировка «Воронка / События / Недавние», полоса
«Скоро»; карточка отклика на вкладках (Обзор / Таймлайн / Контакты / События /
Заметки / CV / Команда).

### Вакансии
Каталог `/vacancies` (статусы + фильтры + поиск) + «Найти вакансии» (живой поиск по
источникам) → «Сохранить»/«Податься» → `Vacancy`/`Application`. Расшаренный отклик
(`visibility: "team"`) автоматически создаёт `Vacancy` (`source: "shared"`).

### Команды
`/teams` — мои команды / создание / вступление по коду / поиск (каталог + люди).
`/teams/:id` — Вакансии (доска) / Активность / Участники (роли, приглашения, заявки) /
Настройки. `/teams/:id/companies/:companyKey` — досье компании: вакансия, таймлайны
участников, отзывы (редактируемые), чат.

### Уведомления
`public/sw.js` + `use-push.ts` (подписка/состояние). Cron (`vercel.json`) →
`/api/cron/reminders` учитывает `NotificationSettings`, шлёт push, удаляет невалидные
подписки. Новый отзыв в команде уведомляет участников (кроме автора).

## 8. Как что-то добавить/поменять

- **Новый источник вакансий** — `lib/vacancy-sources/<id>.ts` + регистрация в `index.ts`
  (+ `VALID_SOURCES` в `api/vacancies/search`). Маппинг в `SourceVacancy`.
- **Новый LLM-провайдер** — `lib/providers.ts`.
- **Новая роль команды** — `TeamRole` в `lib/models/team-membership.ts` + проверки в
  `lib/team.ts` + UI.
- **Новое поле отклика** — `lib/models/application.ts` + `applicationUpdateSchema`
  (`lib/api-schemas.ts`) + PATCH в `api/applications/[id]` + UI.
- **Новый шаг формы CV** — `lib/schemas.ts` → `components/form/steps/*` → `ALL_STEPS`
  (`cv-form.tsx`). Поле `bullets` — массив `{value}` (объект, т.к. `useFieldArray` в
  этой версии react-hook-form не поддерживает массивы примитивов).

## 9. Тесты

Vitest (`npm run test`), тесты в `lib/**/*.test.ts`. LLM-вызовы замоканы (`fetch`),
чтобы прогоны не тратили токены. Покрыто: маппинги источников, `generateCv`/`parseCvFromText`
(валидация схем), `buildDocx`, `normalizeCompany`/`generateInviteCode`/`stageOutcome`/
`serializeVacancy`, `normalizeChannelUsername`/`isAdminEmail`, `format`-хелперы.

## 10. Известные ограничения / TODO

- Rate limit на `/api/generate` и `/api/vacancies/search` не реализован.
- hh.ru блокирует IP Vercel (источник может быть недоступен в проде).
- Нативная поддержка Anthropic/Gemini отсутствует (только через OpenRouter).
- OCR для сканов PDF нет (импорт требует текстовый слой).
- Telegram-лента парсит HTML-превью — хрупко к смене вёрстки; только текстовые посты.
- Ревью-workflow (задания через промты, ментор назначает ревьюера) — в плане.
