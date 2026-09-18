import { z } from "zod"

import type { ChatProvider } from "./providers"
import {
  educationSchema,
  experienceSchema,
  languageSchema,
  personalSchema,
  projectSchema,
  skillSchema,
  type GenerateRequest,
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

const ONE_PAGE = `Формат "одна страница" (обязательно):
- Итоговое CV должно умещаться на одну страницу A4.
- "О себе" — 1-2 предложения, только самое ценное.
- Каждая позиция опыта и проекта — максимум 3 буллета.
- Оставь только самые релевантные вакансии навыки и опыт; нерелевантное опусти.
- Секции без воды, минимальное количество пунктов в списках.`

function buildUserPrompt(input: GenerateRequest, mode: GenerateRequest["mode"]) {
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

  return `Данные кандидата (JSON):
${JSON.stringify(data, null, 2)}

${vacancy ? `Вакансия:\n"""\n${vacancy}\n"""\n` : "Вакансия не задана.\n"}

${modeInstruction[mode]}

${SENIOR_STYLE}

${HONESTY}

${input.length === "one_page" ? ONE_PAGE + "\n\n" : ""}${OUTPUT_CONTRACT}`
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
  user: string
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
      response_format: { type: "json_object" },
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

  const raw = await callChatCompletion(provider, system, buildUserPrompt(input, input.mode))
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
