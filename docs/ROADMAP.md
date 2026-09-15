# ROADMAP — CV-генератор: личный кабинет + трекинг откликов

## Цели

1. Личные кабинеты (NextAuth v5 + MongoDB).
2. Свои LLM-ключи (DeepSeek / OpenAI / OpenRouter / любой OpenAI-совместимый провайдер).
3. Рассылка CV с полным трекингом: отклик → … → офер. Цель — ~100 CV в месяц на разные
   позиции, с пониманием, что и когда отправлено, и с выбором лучшего офера (по ЗП).

## Зафиксированные решения

- **Auth**: email + пароль (credentials), bcrypt, JWT-сессии. Лендинг и анонимный генератор
  остаются публичными; личные функции — только за логином.
- **Провайдеры**: только OpenAI-совместимые (одна абстракция).
- **Воронка**: Kanban-доска + список/таблица с фильтрами.
- **План**: этот файл.

## Зависимости (добавить)

- `next-auth` (v5), `bcryptjs`, `mongoose`.

Env-переменные:

- `MONGODB_URI` — строка подключения к MongoDB.
- `AUTH_SECRET` — секрет JWT NextAuth.
- `ENCRYPTION_KEY` — ключ шифрования (32 байта) для API-ключей пользователя.
- `DEEPSEEK_API_KEY` — серверный ключ-фолбэк (уже есть).

## Архитектура

### Auth (`lib/auth.ts`)

- NextAuth v5 (Auth.js), credentials-провайдер: `authorize` ищет пользователя в MongoDB и
  сверяет bcrypt-хеш.
- JWT-сессии.
- Роут: `app/api/auth/[...nextauth]/route.ts` (экспорт `handlers`).
- `middleware.ts` защищает `/dashboard/*`, `/applications/*`, `/offers`, `/settings/*`.
- Публичное: `/`, `/login`, `/register`, анонимный генератор.

### LLM-слой (`lib/providers.ts` + `lib/llm.ts`)

- Каталог провайдеров:
  - DeepSeek — `https://api.deepseek.com`, модели `deepseek-chat`.
  - OpenAI — `https://api.openai.com/v1`, модели `gpt-4o`, `gpt-4o-mini` и др.
  - OpenRouter — `https://openrouter.ai/api/v1`, модели `openai/*`, `anthropic/*`, `deepseek/*`.
  - Свой endpoint — любой OpenAI-совместимый `baseUrl` + `model`.
- `generateCv(input, provider)` принимает `{ baseUrl, apiKey, model }` вместо захардкоженного
  DeepSeek.
- Ключи пользователя шифруются AES-256-GCM (`lib/encryption.ts`), на клиент отдаются
  маскированными (`sk-…abc`).
- Фолбэк: нет своего ключа → серверный `DEEPSEEK_API_KEY`.

### Модели (`lib/models/*`, Mongoose)

- `User` — email, passwordHash, name, createdAt.
- `ApiKey` — userId, provider, label, baseUrl, model, apiKeyEnc, isDefault.
- `Profile` — userId, label, data (CvFormValues), isDefault.
- `GeneratedCv` — userId, applicationId, profileId, adaptedCv, inputSnapshot, lang.
- `Application` — userId, company, role, country, salaryMin/Max, currency, source{type,url},
  vacancyText, cvId, stageId, timeline[], notes, contacts, sentAt, archived.
- `PipelineStage` — userId, name, order, color, type (`start`/`active`/`terminal`),
  terminalResult (`rejected`/`no-response`/`accepted`).

### Воронка откликов

Настраиваемая, по умолчанию (этапы удалённого найма):

1. Черновик
2. Отправлено
3. Ответ (HR)
4. Собеседование
5. Тех. собеседование
6. Тестовое задание
7. Финальное интервью
8. Офер

Терминальные: Отклонено / Нет ответа / Принято.

**Офер** хранит согласованную ЗП + валюту + бенефиты + remote/office — для сравнения и выбора
лучшего.

## Маршруты

- `/login`, `/register` — вход/регистрация.
- `/dashboard` — счётчики за месяц, воронка, последние отклики.
- `/applications` — kanban + список (фильтры: этап, страна, ЗП, дата).
- `/applications/new` — карточка вакансии + генерация CV под неё.
- `/applications/[id]` — таймлайн этапов, заметки, прикреплённое CV.
- `/offers` — сравнение оферов.
- `/settings/keys` — ключи и провайдеры.
- `/settings/profile` — профили (мастер-данные CV).
- `/settings/pipeline` — настройка этапов воронки.
- `/` — лендинг + анонимный генератор (текущий флоу остаётся; при входе появляются
  «сохранить в профиль» / «создать отклик»).

## Фазы

### A. Фундамент

- `lib/db.ts` — mongoose singleton-подключение.
- Модель `User`.
- NextAuth: `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`.
- `/login`, `/register`.

### B. Провайдеры

- `lib/providers.ts` — каталог + резолв конфигурации.
- `lib/encryption.ts` — AES-256-GCM.
- Рефактор `lib/llm.ts` под `provider`.
- CRUD `ApiKey`, страница `/settings/keys`.
- Обновлённый `/api/generate`: при авторизации берёт провайдера из настроек пользователя.

### C. Профили и сохранённые CV

- Модель `Profile` + `/settings/profile`.
- Префилл формы из сохранённого профиля.
- Модель `GeneratedCv` + повторное скачивание.

### D. Трекинг

- Модели `PipelineStage` и `Application`.
- `/applications` (kanban + список), `/applications/new`, `/applications/[id]`.

### E. Дашборд и оферы

- `/dashboard` — статистика.
- `/offers` — сравнение оферов.
- Фильтры и экспорт.

## Запланировано (дальнейшее развитие)

### F. Интервью-микросервис для сбора данных о себе

Цель — избежать длительного заполнения формы: пользователь проходит короткое
интервью (чат с LLM), по итогам которого формируется файл профиля (по структуре
`profile.yaml`), который сохраняется как профиль и импортируется в систему.

- **Формат**: диалог в чате. LLM задаёт вопросы по секциям профиля (личные данные,
  навыки, опыт, образование, проекты, языки), пользователь отвечает в свободной форме.
- **Результат**: LLM структурирует ответы в `profile.yaml`-совместимый JSON — тот же
  контракт, что принимает `lib/profile-import.ts`; файл сохраняется и импортируется
  как профиль (повторное использование маппера импорта).
- **Уточнения**: возможность переспросить / уточнить отдельные блоки.
- **Хранение**: результат — профиль пользователя (модель `Profile`); опционально
  сохраняется исходный `profile.yaml` для истории и правок.
- **Интеграция**: после интервью сразу доступны «Сгенерировать CV» и импорт; использует
  тот же LLM-провайдер (личный ключ пользователя или серверный фолбэк).

Открытые вопросы (решить при проектировании):

- Отдельный микросервис (и какой транспорт) или модуль внутри Next.js
  (server-side стриминг чата)?
- Текст и/или голос, длина сессии, промежуточные чекпоинты и возобновление.

## Безопасность

- bcrypt для паролей.
- `AUTH_SECRET` для JWT.
- AES-256-GCM для API-ключей пользователя.
- Проверка владельца (`userId`) в каждом роуте.
- Rate limit на генерацию (на пользователя).
