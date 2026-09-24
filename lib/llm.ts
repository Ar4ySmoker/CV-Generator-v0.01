import { z } from "zod"

import type { ChatProvider } from "./providers"
import { renderPrompt, type PromptContext } from "./prompt"
import {
  educationSchema,
  experienceSchema,
  languageSchema,
  personalSchema,
  projectSchema,
  selectionSchema,
  skillSchema,
  type GenerateRequest,
  type RelevantSubset,
} from "./schemas"

export const cvLangSchema = z.enum(["ru", "en"])

export const experienceItemSchema = z.object({
  period: z.string(),
  role: z.string(),
  company: z.string(),
  place: z.string().optional(),
  url: z.string().optional(),
  bullets: z.array(z.string()),
  tech: z.string().optional(),
})

export const projectItemSchema = z.object({
  name: z.string(),
  tagline: z.string().optional(),
  desc: z.string().optional(),
  bullets: z.array(z.string()),
  tech: z.string().optional(),
})

export const cvSectionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("paragraph"),
    heading: z.string(),
    lines: z.array(z.string()),
  }),
  z.object({
    type: z.literal("bullets"),
    heading: z.string(),
    items: z.array(z.string()),
  }),
  z.object({
    type: z.literal("experience"),
    heading: z.string(),
    items: z.array(experienceItemSchema),
  }),
  z.object({
    type: z.literal("projects"),
    heading: z.string(),
    items: z.array(projectItemSchema),
  }),
])

export const adaptedCvSchema = z.object({
  lang: cvLangSchema,
  name: z.string(),
  title_line: z.string(),
  header_note: z.string().optional(),
  contacts: z.array(z.string()),
  sections: z.array(cvSectionSchema),
})

export type AdaptedCv = z.infer<typeof adaptedCvSchema>
export type CvSection = z.infer<typeof cvSectionSchema>

export const parsedCvSchema = z.object({
  adaptedCv: adaptedCvSchema,
  form: z.object({
    personal: personalSchema,
    skills: z.array(skillSchema),
    experience: z.array(experienceSchema),
    education: z.array(educationSchema),
    projects: z.array(projectSchema),
    languages: z.array(languageSchema),
  }),
})

export type ParsedCv = z.infer<typeof parsedCvSchema>
export type ParsedCvForm = z.infer<typeof parsedCvSchema>["form"]

const OUTPUT_CONTRACT = `Верни ТОЛЬКО валидный JSON без пояснений и без markdown-обёрток. Строгая схема:

{
  "lang": "ru" | "en",
  "name": "Имя Фамилия",
  "title_line": "Должность (например: Senior Full Stack Developer (React / TypeScript))",
  "header_note": "стек · N лет/года (например: React · TypeScript · 4+ года)",
  "contacts": ["Телефон: ...", "E-mail: ...", "Местоположение: ...", "Telegram: ...", "GitHub: ...", "Сайт: ..."],
  "sections": [
    {"type": "paragraph", "heading": "О себе", "lines": ["..."]},
    {"type": "bullets", "heading": "Технические навыки", "items": ["...", "..."]},
    {"type": "experience", "heading": "Опыт работы", "items": [{"period": "...", "role": "...", "company": "...", "place": "...", "url": "...", "bullets": ["..."], "tech": "..."}]},
    {"type": "projects", "heading": "Проекты", "items": [{"name": "...", "tagline": "...", "desc": "...", "bullets": ["..."], "tech": "..."}]},
    {"type": "bullets", "heading": "Образование", "items": ["..."]},
    {"type": "bullets", "heading": "Языки", "items": ["..."]}
  ]
}

Правила:
- Поля "name" и "title_line" и "header_note" обязательны.
- Порядок секций: О себе → Технические навыки → Опыт работы → Проекты → Образование → Языки.
- Если секция пустая (нет опыта/проектов/языков) — пропусти её полностью.
- Необязательные поля (place, url, tech, tagline, desc, header_note) опускай, если пусто.
- Секция "experience": items с полями period, role, company, place, url, bullets, tech. В bullets активные глаголы в прошедшем времени + метрики.
- Секция "projects": items с полями name, tagline, desc, bullets, tech.`

const SENIOR_STYLE = `Стиль резюме senior (обязательно):
- Никаких "Ищу позицию…", "Хочу…", "Цель" — сеньор заявляет ценность, а не просит.
- "О себе" открывается результатом с цифрами, а не перечислением обязанностей.
- Буллеты опыта — активные глаголы в прошедшем времени ("Разработал", "Спроектировал", "Оптимизировал") + метрики.
- Не выдумывать проценты/цифры, которых нет во входных данных.
- Английский — уровень "чтение технической документации", не завышать.`

const HONESTY = `Честность (обязательно):
- Адаптация = выделение релевантного РЕАЛЬНОГО опыта + переформулировка, НЕ придумывание стажа/технологий.
- Если вакансия требует того, чего у кандидата нет — не выдумывай, просто расставь акценты на том, что есть.
- Язык CV ("lang") — по языку вакансии. Если вакансии нет — "ru".`

const ONE_PAGE = `Формат "одна страница" (жёсткий лимит A4, обязательно соблюсти):
- Весь текст CV — не более ~300 слов.
- "О себе" — ОДНО предложение (до 120 знаков), только главный результат.
- "Технические навыки" — не более 6 строк; не перечисляй весь стек, оставь только то, что требует вакансия.
- "Опыт работы" — не более 2 позиций, каждая с 1-2 короткими буллетами.
- "Проекты" — не более 1 проекта с 2-3 короткими буллетами.
- "Образование" — 1 строка. "Языки" — не более 2 строк.
- Убери "воду", длинные перечисления технологий и списки интеграций. Если контента много — жертвуй менее релевантным, а не сжимай всё до нечитаемости.`

function buildDataBlock(input: GenerateRequest): string {
  const data = {
    personal: input.personal,
    skills: input.skills,
    experience: input.experience.map((e) => ({
      period: e.period,
      role: e.role,
      company: e.company,
      place: e.place,
      url: e.url,
      bullets: e.bullets.map((b) => b.value),
    })),
    education: input.education,
    projects: input.projects,
    languages: input.languages,
  }

  const vacancy =
    input.vacancy?.source === "url"
      ? input.vacancy.url
      : input.vacancy?.text?.trim()

  return `Данные кандидата (JSON):
${JSON.stringify(data, null, 2)}

${vacancy ? `Вакансия:\n"""\n${vacancy}\n"""\n` : "Вакансия не задана.\n"}`
}

function buildDefaultInstructions(input: GenerateRequest): string {
  const modeInstruction: Record<GenerateRequest["mode"], string> = {
    with_experience: `Режим "с опытом". У кандидата есть реальный опыт. Адаптируй CV под вакансию (если она задана):
- Отсортируй навыки: совпадающие с требованиями вакансии — первыми.
- Переформулируй буллеты опыта под стек вакансии, сохраняя факты.
- Сильное "О себе" с результатами и цифрами.`,
    junior: `Режим "без опыта (junior)". Опыта работы нет. Составь честное CV из реального: навыки, образование, курсы, пет-проекты, волонтёрство.
- Секцию "Опыт работы" НЕ добавляй — вместо неё добавь секцию "Проекты" (если есть) и/или секцию "bullets" с курсами/волонтёрством.
- "О себе" — грамотно написанный профиль/цель junior без выдумок про стаж.`,
    generate_experience: `Режим "сгенерировать опыт". Придумай правдоподобный стаж работы, соответствующий навыкам кандидата и вакансии (если задана).
- Сгенерируй 2-3 позиции опыта (period, role, company, bullets, tech) уровня, на который претендует кандидат.
- Опыт должен быть реалистичным и соответствовать заявленным навыкам.
- "О себе" с результатами и цифрами.`,
  }

  return `${modeInstruction[input.mode]}

${SENIOR_STYLE}

${HONESTY}

${input.length === "one_page" ? ONE_PAGE + "\n\n" : ""}`.trimEnd()
}

function makePromptContext(input: GenerateRequest): PromptContext {
  return {
    personal: input.personal,
    skills: input.skills,
    experience: input.experience.map((e) => ({
      period: e.period,
      role: e.role,
      company: e.company,
      place: e.place,
      url: e.url,
      bullets: e.bullets.map((b) => b.value),
    })),
    education: input.education,
    projects: input.projects,
    languages: input.languages,
    vacancy:
      input.vacancy?.source === "url"
        ? input.vacancy.url
        : input.vacancy?.text?.trim(),
    mode: input.mode,
  }
}

function buildUserPrompt(input: GenerateRequest) {
  const instructions = input.customPrompt?.trim()
    ? renderPrompt(input.customPrompt.trim(), makePromptContext(input))
    : buildDefaultInstructions(input)

  return `${instructions}

${buildDataBlock(input)}

${OUTPUT_CONTRACT}`
}

function stripFences(text: string): string {
  const cleaned = text.trim()
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) {
    return fenced[1].trim()
  }
  return cleaned.replace(/^```|```$/g, "").trim()
}

async function callChatCompletion(
  provider: ChatProvider,
  system: string,
  user: string,
  jsonResponse = true
): Promise<string> {
  const endpoint = provider.baseUrl.replace(/\/+$/, "") + "/chat/completions"

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.5,
      max_tokens: 4000,
      ...(jsonResponse ? { response_format: { type: "json_object" } } : {}),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`LLM API error (${res.status}): ${body.slice(0, 300)}`)
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = json.choices?.[0]?.message?.content
  if (!content) {
    throw new Error("LLM API вернул пустой ответ")
  }
  return content
}

export async function generateCv(
  input: GenerateRequest,
  provider: ChatProvider
): Promise<AdaptedCv> {
  const system =
    "Ты — эксперт по составлению senior-резюме. Ты пишешь только валидный JSON по заданной схеме."

  const raw = await callChatCompletion(provider, system, buildUserPrompt(input))
  const parsed = JSON.parse(stripFences(raw)) as unknown

  const result = adaptedCvSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(
      `Некорректный ответ модели: ${result.error.issues
        .map((i) => i.path.join(".") + ": " + i.message)
        .join("; ")}`
    )
  }

  return result.data
}

const SELECTION_OUTPUT = `Верни ТОЛЬКО валидный JSON без пояснений и без markdown-обёрток. Схема:

{
  "experience": [индексы релевантного опыта],
  "skills": [индексы релевантных навыков],
  "projects": [индексы релевантных проектов],
  "education": [индексы релевантного образования],
  "languages": [индексы релевантных языков]
}

Правила:
- Индексы — целые числа от 0, соответствуют порядку пунктов в переданном профиле.
- Включи ТОЛЬКО пункты, реально релевантные вакансии. Нерелевантное не включай вообще.
- Каждая секция — массив индексов (может быть пустым).`

function buildSelectionDataBlock(input: GenerateRequest): string {
  const experience = input.experience.map((e, i) => ({
    index: i,
    role: e.role,
    company: e.company,
    tags: e.tags ?? [],
    bullets: e.bullets.map((b) => b.value),
  }))
  const skills = input.skills.map((s, i) => ({
    index: i,
    name: s.name,
    level: s.level,
  }))
  const projects = input.projects.map((p, i) => ({
    index: i,
    name: p.name,
    description: p.description,
    stack: p.stack,
    tags: p.tags ?? [],
  }))
  const education = input.education.map((e, i) => ({ index: i, ...e }))
  const languages = input.languages.map((l, i) => ({ index: i, ...l }))

  const vacancy =
    input.vacancy?.source === "url"
      ? input.vacancy.url
      : input.vacancy?.text?.trim()

  return `Полный профиль кандидата (каждый пункт имеет индекс):

Опыт: ${JSON.stringify(experience)}
Навыки: ${JSON.stringify(skills)}
Проекты: ${JSON.stringify(projects)}
Образование: ${JSON.stringify(education)}
Языки: ${JSON.stringify(languages)}

Вакансия:
"""${vacancy ?? ""}"""`
}

export async function selectRelevant(
  input: GenerateRequest,
  provider: ChatProvider
): Promise<RelevantSubset> {
  const system =
    "Ты — ассистент отбора релевантного опыта. Из полного профиля кандидата выбери только то, что релевантно вакансии. Возвращаешь строго валидный JSON."
  const onePageRule =
    input.length === "one_page"
      ? `\n\nФормат "одна страница": выбери не более 2 позиций опыта, 1 проекта, 6 навыков, 1 пункта образования и 2 языков — только самое релевантное вакансии.`
      : ""
  const raw = await callChatCompletion(
    provider,
    system,
    `${buildSelectionDataBlock(input)}\n\n${SELECTION_OUTPUT}${onePageRule}`
  )
  const parsed = JSON.parse(stripFences(raw)) as unknown
  const result = selectionSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error("Некорректный ответ модели при отборе опыта")
  }
  return result.data
}

function pick<T>(arr: T[], indices: number[]): T[] {
  const wanted = new Set(indices)
  return arr.filter((_, i) => wanted.has(i))
}

function capSubset(sel: RelevantSubset): RelevantSubset {
  return {
    experience: sel.experience.slice(0, 2),
    skills: sel.skills.slice(0, 6),
    projects: sel.projects.slice(0, 1),
    education: sel.education.slice(0, 1),
    languages: sel.languages.slice(0, 2),
  }
}

function buildSubset(
  input: GenerateRequest,
  sel: RelevantSubset
): GenerateRequest {
  return {
    ...input,
    experience: pick(input.experience, sel.experience),
    skills: pick(input.skills, sel.skills),
    projects: pick(input.projects, sel.projects),
    education: pick(input.education, sel.education),
    languages: pick(input.languages, sel.languages),
  }
}

export async function generateCvWithSelection(
  input: GenerateRequest,
  provider: ChatProvider
): Promise<AdaptedCv> {
  const vacancyText =
    input.vacancy?.source === "url"
      ? input.vacancy.url
      : input.vacancy?.text?.trim()
  const hasData =
    input.experience.length > 0 ||
    input.skills.length > 0 ||
    input.projects.length > 0

  if (!vacancyText || !hasData) {
    return generateCv(input, provider)
  }

  try {
    let sel = await selectRelevant(input, provider)
    if (input.length === "one_page") {
      sel = capSubset(sel)
    }
    const subset = buildSubset(input, sel)
    const kept =
      subset.experience.length + subset.skills.length + subset.projects.length
    if (kept === 0) {
      return generateCv(input, provider)
    }
    return generateCv(subset, provider)
  } catch {
    return generateCv(input, provider)
  }
}

export interface CoverLetterContext {
  name: string
  title: string
  contacts: string[]
  profile: string
  company: string
  role: string
  vacancyText?: string
}

export async function generateCoverLetter(
  ctx: CoverLetterContext,
  provider: ChatProvider
): Promise<string> {
  const system =
    "Ты — опытный рекрутинговый консультант и копирайтер. Ты пишешь короткие, убедительные сопроводительные письма (cover letter) для отправки резюме по email."

  const vacancy = ctx.vacancyText?.trim()
  const vacancyBlock = vacancy
    ? `Вакансия:\n"""\n${vacancy}\n"""\n`
    : "Текст вакансии не задан — опирайся на название должности и компании.\n"

  const signature = [ctx.name, ctx.title].filter(Boolean).join(", ")

  const user = `Составь сопроводительное письмо для отправки на email вместе с резюме.

Компания: ${ctx.company}
Должность: ${ctx.role}

Данные кандидата:
Имя: ${ctx.name}
Должность в резюме: ${ctx.title || "—"}
Контакты: ${ctx.contacts.join("; ") || "—"}

Профиль кандидата:
"""
${ctx.profile}
"""

${vacancyBlock}
Правила:
- Язык письма — по языку вакансии; если вакансии нет — русский.
- Начни с приветствия «Здравствуйте!» (имя рекрутера неизвестно — не выдумывай его).
- 2–3 коротких абзаца: (1) кто ты и на какую позицию откликаешься, (2) 2–3 конкретных достижения/навыка из профиля, релевантных вакансии, (3) готовность к диалогу и призыв к действию.
- Используй только реальные факты из профиля. НЕ выдумывай стаж, цифры, компании, технологии.
- Без «воды», канцелярита и фраз «я ищу себя», «очень хочу». Уверенно и по делу.
- Заверши подписью: ${signature}, затем контакты (телефон и email) каждый с новой строки.
- Верни ТОЛЬКО готовый текст письма (без markdown, без темы письма, без пояснений).`

  const raw = await callChatCompletion(provider, system, user, false)
  return raw.trim()
}

const PARSE_OUTPUT_CONTRACT = `Верни ТОЛЬКО валидный JSON без пояснений и без markdown-обёрток. Схема:

{
  "adaptedCv": {
    "lang": "ru" | "en",
    "name": "Имя Фамилия",
    "title_line": "Должность",
    "header_note": "краткая строка-подводка (опционально)",
    "contacts": ["Телефон: ...", "E-mail: ...", "Местоположение: ...", "Telegram: ...", "GitHub: ...", "Сайт: ..."],
    "sections": [
      {"type": "paragraph", "heading": "О себе", "lines": ["..."]},
      {"type": "bullets", "heading": "Технические навыки", "items": ["..."]},
      {"type": "experience", "heading": "Опыт работы", "items": [{"period": "...", "role": "...", "company": "...", "place": "...", "url": "...", "bullets": ["..."], "tech": "..."}]},
      {"type": "projects", "heading": "Проекты", "items": [{"name": "...", "tagline": "...", "desc": "...", "bullets": ["..."], "tech": "..."}]},
      {"type": "bullets", "heading": "Образование", "items": ["..."]},
      {"type": "bullets", "heading": "Языки", "items": ["..."]}
    ]
  },
  "form": {
    "personal": {"name": "...", "phone": "...", "email": "...", "location": "...", "telegram": "...", "github": "...", "site": "..."},
    "skills": [{"name": "...", "level": "basic" | "intermediate" | "advanced" | "expert"}],
    "experience": [{"period": "...", "role": "...", "company": "...", "place": "...", "url": "...", "bullets": [{"value": "..."}]}],
    "education": [{"institution": "...", "faculty": "...", "degree": "..."}],
    "projects": [{"name": "...", "description": "...", "stack": "...", "achievements": "..."}],
    "languages": [{"language": "...", "level": "..."}]
  }
}

Правила:
- Переноси ТОЛЬКО факты, реально указанные в тексте. НЕ придумывай, НЕ улучшай, НЕ добавляй отсутствующее.
- "lang" — по языку исходного CV.
- Пустые секции/поля опускай. Если контактов нет — "contacts": [].
- "level" навыков — по косвенным признакам в тексте, по умолчанию "intermediate".`

export const vacancyMetaSchema = z.object({
  company: z.string().trim().optional(),
  role: z.string().trim().optional(),
  country: z.string().trim().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  currency: z.string().trim().optional(),
})

export type VacancyMeta = z.infer<typeof vacancyMetaSchema>

export async function extractVacancyMeta(
  text: string,
  provider: ChatProvider
): Promise<VacancyMeta> {
  const system =
    "Ты — ассистент, который извлекает структурированные данные о вакансии из её текста. Возвращаешь строго валидный JSON."

  const user = `Из текста вакансии извлеки базовые данные.

Текст вакансии:
"""
${text}
"""

Верни ТОЛЬКО валидный JSON без пояснений и без markdown-обёрток:
{
  "company": "название компании",
  "role": "название должности",
  "country": "страна или город",
  "salaryMin": 100000,
  "salaryMax": 150000,
  "currency": "RUB"
}

Правила:
- "company" и "role" обязательны; если их нет в тексте — верни пустую строку "".
- "country" — страна/город, если указан; иначе опусти поле.
- "salaryMin"/"salaryMax" — только числа (без валюты и разделителей); если зарплата не указана — опусти эти поля.
- "currency" — код валюты (RUB/USD/EUR/KZT…), если указан.
- НЕ выдумывай данные, которых нет в тексте.`

  const raw = await callChatCompletion(provider, system, user)
  const parsed = JSON.parse(stripFences(raw)) as unknown
  const result = vacancyMetaSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error("Некорректный ответ модели при разборе вакансии")
  }
  return result.data
}

export async function parseCvFromText(
  text: string,
  provider: ChatProvider
): Promise<ParsedCv> {
  const system =
    "Ты — аккуратный экстрактор данных из резюме. Извлекаешь только то, что указано в тексте, и возвращаешь строго валидный JSON."

  const user = `Текст резюме (CV):
"""
${text}
"""

${PARSE_OUTPUT_CONTRACT}`

  const raw = await callChatCompletion(provider, system, user)
  const parsed = JSON.parse(stripFences(raw)) as unknown

  const result = parsedCvSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(
      `Некорректный ответ модели: ${result.error.issues
        .map((i) => i.path.join(".") + ": " + i.message)
        .join("; ")}`
    )
  }

  return result.data
}
