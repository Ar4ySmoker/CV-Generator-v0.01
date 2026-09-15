# CV-генератор + трекер откликов

Веб-приложение: генерация адаптированного CV в **DOCX** под конкретную вакансию и
трекинг откликов — от отправки до офера, со сравнением оферов.

## Возможности

- **Генератор CV** — три режима: «с опытом», «без опыта (junior)», «сгенерировать опыт» (с обязательным дисклеймером). На выходе ATS-friendly `.docx`.
- **Свои LLM-ключи** — DeepSeek / OpenAI / OpenRouter / любой OpenAI-совместимый endpoint. Ключи хранятся зашифрованными (AES-256-GCM).
- **Личный кабинет** — email + пароль (NextAuth v5, JWT), профили (переиспользуемые мастер-данные CV).
- **Трекинг откликов** — Kanban-доска + список, настраиваемая воронка этапов, таймлайн, заметки, привязка сгенерированного CV.
- **Оферы** — фиксация ЗП/бенефитов/формата и сравнение оферов.
- **Дашборд** — счётчики, воронка, последние отклики.

## Стек

Next.js 16 (App Router, Turbopack) · TypeScript (strict) · Tailwind v4 · shadcn/ui ·
react-hook-form + zod · `docx` · NextAuth v5 (credentials + JWT) · Mongoose (MongoDB) ·
bcryptjs · next-themes.

## Быстрый старт

```bash
npm install
cp .env.example .env.local   # заполнить переменные
npm run dev
```

## Переменные окружения

| Переменная | Назначение |
|---|---|
| `MONGODB_URI` | Строка подключения MongoDB (Atlas), с именем БД |
| `AUTH_SECRET` | Секрет JWT (`openssl rand -base64 32`) |
| `ENCRYPTION_KEY` | Ключ шифрования API-ключей, 32 байта (`openssl rand -base64 32`) |
| `DEEPSEEK_API_KEY` | Серверный LLM-ключ-фолбэк |

## Команды

```bash
npm run dev        # dev-сервер
npm run build      # production-сборка
npm run start      # запуск production
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

## Деплой (Vercel)

Подключить репозиторий, в `Settings → Environment Variables` задать 4 переменные выше.
`trustHost` включён в коде — `AUTH_TRUST_HOST` не нужен.

## Документация

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — полная архитектура, модель данных, API, флоу.
- [docs/ROADMAP.md](docs/ROADMAP.md) — план развития по фазам.
- [AGENTS.md](AGENTS.md) — инструкция для AI-агента (читается в начале сессии).
