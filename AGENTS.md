# AGENTS.md — CV-генератор + трекер откликов

Прочитай этот файл в начале работы над `CV-Generator-v0.01/`. Полная архитектура,
модель данных и API — в `docs/ARCHITECTURE.md`; план развития — в `docs/ROADMAP.md`.

## Что это

Веб-приложение из четырёх частей:

1. **Генератор CV** — пользователь вводит опыт (опционально — вакансию), LLM
   адаптирует текст под вакансию, сервер отдаёт готовый `.docx` (ATS-friendly).
   Есть шаблоны + цвет и импорт готового PDF/DOCX.
2. **Трекер откликов** — личный кабинет: рассылка CV и отслеживание от отклика до
   офера (воронка этапов, таймлайн, заметки, контакты, собеседования, сравнение оферов).
3. **Каталог и поиск вакансий** — глобальный каталог + живой поиск по источникам
   (hh.ru, Хабр Карьера, Remote OK, Работа России, Jooble) + Telegram-лента.
4. **Команды** — доска вакансий по компаниям, таймлайны участников, отзывы о
   собеседованиях, чат, роли (владелец/участник/ментор/ревьюер).

## Стек (обязательный)

- **Next.js 16 (App Router, Turbopack) + TypeScript strict + Tailwind CSS v4**
- **shadcn/ui** (style `radix-maia`, base `mist`) — критичное правило ниже
- **react-hook-form + zod** — формы и валидация
- **docx** (npm) — генерация .docx на сервере
- **NextAuth v5** (`next-auth@5.0.0-beta`) — credentials (email+пароль) + JWT
- **Mongoose (MongoDB Atlas)** — хранение
- **bcryptjs** — хеширование паролей
- **LLM** — DeepSeek / OpenAI / OpenRouter / любой OpenAI-совместимый (пользователь
  подключает свой ключ; фолбэк — серверный `DEEPSEEK_API_KEY`)
- Деплой: **Vercel**

## ⚠️ КРИТИЧНО: shadcn/ui

- Всегда использовать готовые компоненты shadcn/ui; новые составные — собирать **из**
  shadcn-примитивов, не писать вёрстку с нуля.
- Добавление компонента: `npx shadcn@latest add <name>`.

## Правила

- Без комментариев в коде, если явно не просят.
- Строгий TypeScript, **никаких `any`**.
- Секреты только в env (`.env.local`, gitignored). Переменные: `MONGODB_URI`,
  `AUTH_SECRET`, `ENCRYPTION_KEY`, `DEEPSEEK_API_KEY`, `VAPID_*`/`NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
  `CRON_SECRET`, `ADMIN_EMAILS` (админы Telegram-каналов), `JOOBLE_API_KEY`/`JOOBLE_LOCATION` (опц.).
- Дисклеймер для режима «сгенерировать опыт» обязателен.
- Проверка владельца (`userId`) в каждом API-роуте.

## Режимы генерации

1. **С опытом** — адаптация реального опыта под вакансию.
2. **Без опыта (junior)** — честное CV из навыков/образования/проектов.
3. **Сгенерировать опыт** — LLM придумывает стаж (обязателен дисклеймер-чекбокс).

## Форма (мультишаг)

Шаги: личные данные → навыки → опыт (только «с опытом») → образование → проекты →
языки → вакансия (текст или URL; при блокировке URL — «вставьте текст»).

## Ключевые файлы (для навигации)

- `lib/schemas.ts` — Zod-схема `CvFormValues` и запроса генерации.
- `lib/llm.ts` — LLM-клиент + промпты + контракт `AdaptedCv`; `lib/providers.ts` —
  каталог провайдеров; `lib/resolve-provider.ts` — выбор ключа.
- `lib/docx.ts` (+ `lib/cv-templates.ts`) — сборка DOCX и шаблоны; `lib/vacancy.ts` —
  fetch вакансии; `lib/cv-import.ts` — импорт PDF/DOCX.
- `lib/auth.ts` (+ `auth.config.ts`, `proxy.ts`) — NextAuth и защита маршрутов;
  `lib/admin.ts` — админы (`ADMIN_EMAILS`).
- `lib/team.ts` — команды/роли/активность; `lib/vacancy-sources/*` — источники
  поиска вакансий; `lib/telegram-feed.ts` — Telegram-лента.
- `lib/models/*` — Mongoose-модели; `lib/pipeline.ts` — дефолтные этапы.
- `components/form/cv-form.tsx` — мультишаг; `components/generator.tsx` — машина
  состояний режим→дисклеймер→форма.

## Как проверять

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint (0 ошибок)
npm run build       # production-сборка
npm run test        # vitest (LLM-вызовы замоканы — без токенов)
```

## Известные нюансы

- В Mongoose нельзя называть поле `model` — конфликт с методом документа
  (в `ApiKey` — `modelName`).
- `bullets` в форме опыта — массив объектов `{value}`: `useFieldArray` в этой версии
  react-hook-form не поддерживает массивы примитивов.
- Роут-защита — в `proxy.ts` (Next 16 депрекейтил `middleware.ts`).
- В `next-auth` нет стабильного v5 — используется `5.0.0-beta.x` (как в lavka-pmr).
- hh.ru может блокировать IP Vercel (403) — источник помечается «недоступен», не роняет поиск.
- Telegram-лента парсит HTML-превью `t.me/s/<channel>` — хрупко к смене вёрстки.
