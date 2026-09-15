import { load } from "js-yaml"

import { cvFormSchema, type CvFormValues, type SkillLevel } from "./schemas"

function asRecord(v: unknown): Record<string, unknown> {
  return v != null && typeof v === "object" ? (v as Record<string, unknown>) : {}
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : ""
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : []
}

function asRecordArray(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v)
    ? v.filter(
        (x): x is Record<string, unknown> => x != null && typeof x === "object"
      )
    : []
}

function mapSkills(
  skills: unknown,
  lang: "ru"
): Array<{ name: string; level: SkillLevel }> {
  const obj = asRecord(skills)
  const result: Array<{ name: string; level: SkillLevel }> = []
  for (const [key, value] of Object.entries(obj)) {
    const str = asString(asRecord(value)[lang]) || asString(value)
    if (!str) continue
    const level: SkillLevel = key === "core" ? "expert" : "advanced"
    for (const part of str.split(", ")) {
      const name = part.trim()
      if (name) result.push({ name, level })
    }
  }
  return result
}

function mapMasterProfile(p: Record<string, unknown>, lang: "ru"): CvFormValues {
  const personalObj = asRecord(asRecord(p.personal)[lang])

  const personal = {
    name: asString(personalObj.name),
    phone: asString(personalObj.phone),
    email: asString(personalObj.email),
    location: asString(personalObj.location),
    telegram: asString(personalObj.telegram),
    site: asString(personalObj.site),
    github: asString(personalObj.github),
  }

  const skills = mapSkills(p.skills, lang)

  const experience = asRecordArray(p.experience).map((e) => {
    const bullets = asStringArray(e[`bullets_${lang}`]).map((b) => ({
      value: b,
    }))
    const tech = asString(e.tech)
    if (tech) {
      bullets.push({ value: `Технологии: ${tech}` })
    }
    return {
      period: asString(e[`period_${lang}`]),
      role: asString(e[`role_${lang}`]),
      company: asString(e.company),
      place: asString(e.place),
      url: asString(e.url),
      bullets,
    }
  })

  const eduLines = asStringArray(asRecord(p.education)[lang])
  const education = eduLines.length
    ? [
        {
          institution: eduLines[0] ?? "",
          faculty: eduLines[1] ?? "",
          degree: eduLines[2] ?? "",
        },
      ]
    : []

  const projects = asRecordArray(p.projects).map((pr) => ({
    name: asString(pr.name),
    description: [asString(pr[`tagline_${lang}`]), asString(pr[`desc_${lang}`])]
      .filter(Boolean)
      .join(" — "),
    stack: asString(pr.tech),
    achievements: asStringArray(pr[`bullets_${lang}`]).join("\n"),
  }))

  const languages = asStringArray(asRecord(p.languages)[lang]).map((s) => {
    const idx = s.search(/[—–-]/)
    if (idx === -1) {
      return { language: s.trim(), level: "" }
    }
    return { language: s.slice(0, idx).trim(), level: s.slice(idx + 1).trim() }
  })

  return { personal, skills, experience, education, projects, languages }
}

export function parseProfileSource(raw: string): CvFormValues {
  const trimmed = raw.trim()
  if (!trimmed) {
    throw new Error("Вставьте содержимое файла")
  }

  let data: unknown
  try {
    data = JSON.parse(trimmed)
  } catch {
    data = load(trimmed)
  }

  const obj = asRecord(data)
  if (!obj.personal) {
    throw new Error(
      "Не удалось распознать структуру профиля (ожидался profile.yaml)"
    )
  }

  const mapped = mapMasterProfile(obj, "ru")
  const parsed = cvFormSchema.safeParse(mapped)
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Профиль не прошёл валидацию"
    )
  }

  return parsed.data
}
