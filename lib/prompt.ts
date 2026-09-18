export interface PromptPersonal {
  name: string
  phone?: string
  email?: string
  location?: string
  telegram?: string
  github?: string
  site?: string
}

export interface PromptExperience {
  period: string
  role: string
  company: string
  place?: string
  url?: string
  bullets: string[]
}

export interface PromptContext {
  personal: PromptPersonal
  skills: Array<{ name: string; level: string }>
  experience: PromptExperience[]
  education: Array<{ institution: string; faculty?: string; degree?: string }>
  projects: Array<{
    name: string
    description?: string
    stack?: string
    achievements?: string
  }>
  languages: Array<{ language: string; level: string }>
  vacancy?: string
  mode: string
}

export const PROMPT_PLACEHOLDERS = [
  "{{personal.name}}",
  "{{personal.phone}}",
  "{{personal.email}}",
  "{{personal.location}}",
  "{{personal.telegram}}",
  "{{personal.github}}",
  "{{personal.site}}",
  "{{skills}}",
  "{{experience}}",
  "{{education}}",
  "{{projects}}",
  "{{languages}}",
  "{{vacancy}}",
  "{{mode}}",
]

function skillsText(skills: PromptContext["skills"]): string {
  return skills.map((s) => `${s.name} (${s.level})`).join(", ")
}

function experienceText(items: PromptExperience[]): string {
  return items
    .map(
      (e) =>
        `${e.period} · ${e.role} · ${e.company}${e.place ? ` · ${e.place}` : ""}${
          e.bullets.length ? `\n  - ${e.bullets.join("\n  - ")}` : ""
        }`
    )
    .join("\n")
}

function educationText(items: PromptContext["education"]): string {
  return items
    .map(
      (e) =>
        `${e.institution}${e.faculty ? ` · ${e.faculty}` : ""}${
          e.degree ? ` · ${e.degree}` : ""
        }`
    )
    .join("\n")
}

function projectsText(items: PromptContext["projects"]): string {
  return items
    .map(
      (p) =>
        `${p.name}${p.description ? ` — ${p.description}` : ""}${
          p.stack ? `\n  Стек: ${p.stack}` : ""
        }${p.achievements ? `\n  ${p.achievements}` : ""}`
    )
    .join("\n")
}

function languagesText(items: PromptContext["languages"]): string {
  return items.map((l) => `${l.language} (${l.level})`).join(", ")
}

export function renderPrompt(content: string, ctx: PromptContext): string {
  const p = ctx.personal
  return content
    .replaceAll("{{personal.name}}", p.name ?? "")
    .replaceAll("{{personal.phone}}", p.phone ?? "")
    .replaceAll("{{personal.email}}", p.email ?? "")
    .replaceAll("{{personal.location}}", p.location ?? "")
    .replaceAll("{{personal.telegram}}", p.telegram ?? "")
    .replaceAll("{{personal.github}}", p.github ?? "")
    .replaceAll("{{personal.site}}", p.site ?? "")
    .replaceAll("{{skills}}", skillsText(ctx.skills))
    .replaceAll("{{experience}}", experienceText(ctx.experience))
    .replaceAll("{{education}}", educationText(ctx.education))
    .replaceAll("{{projects}}", projectsText(ctx.projects))
    .replaceAll("{{languages}}", languagesText(ctx.languages))
    .replaceAll("{{vacancy}}", ctx.vacancy ?? "")
    .replaceAll("{{mode}}", ctx.mode)
}

export function buildReferencePrompt(): string {
  return `Ты — эксперт по составлению senior-резюме. Составь резюме по данным кандидата и вакансии ниже.

СТИЛЬ (отредактируй под себя):
- Никаких "Ищу позицию…", "Хочу…", "Цель" — сеньор заявляет ценность, а не просит.
- "О себе" открывается результатом с цифрами, а не перечислением обязанностей.
- Буллеты опыта — активные глаголы в прошедшем времени + метрики.
- Не выдумывать проценты/цифры, которых нет во входных данных.
- Английский — уровень "чтение технической документации", не завышать.

ЧЕСТНОСТЬ:
- Адаптация = выделение релевантного РЕАЛЬНОГО опыта + переформулировка, НЕ придумывание.
- Если вакансия требует того, чего нет — не выдумывай, расставь акценты на том, что есть.

ДАННЫЕ КАНДИДАТА (замени на свои):
Имя: {{personal.name}}
Навыки: {{skills}}
Опыт: {{experience}}
Образование: {{education}}
Проекты: {{projects}}
Языки: {{languages}}

ВАКАНСИЯ:
{{vacancy}}

После правок вставь итоговый текст на платформе в поле «Свой промт» — платформа подставит данные формы и соберёт DOCX.`
}
