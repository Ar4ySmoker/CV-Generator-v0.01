import { NextResponse } from "next/server"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { generateCoverLetter } from "@/lib/llm"
import type { AdaptedCv } from "@/lib/llm"
import { Application } from "@/lib/models/application"
import { GeneratedCv } from "@/lib/models/generated-cv"
import { Profile } from "@/lib/models/profile"
import { resolveProvider } from "@/lib/resolve-provider"
import type { CvFormValues } from "@/lib/schemas"

export const runtime = "nodejs"

function adaptedCvProfileText(cv: AdaptedCv): string {
  return cv.sections
    .map((s) => {
      const body =
        s.type === "paragraph"
          ? s.lines.join(" ")
          : s.type === "bullets"
            ? s.items.join("; ")
            : s.type === "experience"
              ? s.items
                  .map(
                    (i) =>
                      `${i.period} — ${i.role}, ${i.company}: ${i.bullets.join(" ")}`
                  )
                  .join("\n")
              : s.items.map((i) => `${i.name}: ${i.bullets.join(" ")}`).join("\n")
      return `${s.heading}:\n${body}`
    })
    .join("\n\n")
}

function profileDataText(data: CvFormValues): string {
  const parts: string[] = []
  if (data.skills.length) {
    parts.push(
      `Навыки:\n${data.skills.map((s) => `${s.name} (${s.level})`).join(", ")}`
    )
  }
  if (data.experience.length) {
    parts.push(
      `Опыт работы:\n${data.experience
        .map(
          (e) =>
            `${e.period} — ${e.role}, ${e.company}: ${e.bullets.map((b) => b.value).join(" ")}`
        )
        .join("\n")}`
    )
  }
  if (data.projects.length) {
    parts.push(
      `Проекты:\n${data.projects
        .map((p) => `${p.name}${p.description ? `: ${p.description}` : ""}`)
        .join("\n")}`
    )
  }
  if (data.education.length) {
    parts.push(
      `Образование:\n${data.education
        .map((e) => [e.institution, e.faculty, e.degree].filter(Boolean).join(", "))
        .join("\n")}`
    )
  }
  if (data.languages.length) {
    parts.push(
      `Языки:\n${data.languages.map((l) => `${l.language} (${l.level})`).join(", ")}`
    )
  }
  return parts.join("\n\n")
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id } = await params
  await connectDb()

  const app = await Application.findOne({ _id: id, userId })
  if (!app) {
    return NextResponse.json({ error: "Отклик не найден" }, { status: 404 })
  }

  let name = ""
  let title = ""
  const contacts: string[] = []
  let profile = ""

  if (app.cvId) {
    const cv = await GeneratedCv.findOne({ _id: app.cvId, userId })
    if (cv) {
      name = cv.adaptedCv.name
      title = cv.adaptedCv.title_line
      for (const c of cv.adaptedCv.contacts ?? []) {
        contacts.push(c)
      }
      profile = adaptedCvProfileText(cv.adaptedCv)
    }
  }

  if (!profile) {
    const p = await Profile.findOne({ userId, isDefault: true }).sort({
      createdAt: -1,
    })
    if (p?.data) {
      const d = p.data
      name = d.personal.name
      title = d.experience[0]?.role ?? ""
      if (d.personal.phone) contacts.push(`Телефон: ${d.personal.phone}`)
      if (d.personal.email) contacts.push(`E-mail: ${d.personal.email}`)
      if (d.personal.location)
        contacts.push(`Местоположение: ${d.personal.location}`)
      if (d.personal.telegram) contacts.push(`Telegram: ${d.personal.telegram}`)
      if (d.personal.github) contacts.push(`GitHub: ${d.personal.github}`)
      if (d.personal.site) contacts.push(`Сайт: ${d.personal.site}`)
      profile = profileDataText(d)
    }
  }

  if (!profile) {
    return NextResponse.json(
      { error: "Нет данных кандидата. Сгенерируйте CV или сохраните профиль." },
      { status: 400 }
    )
  }

  try {
    const provider = await resolveProvider(userId)
    const text = await generateCoverLetter(
      {
        name,
        title,
        contacts,
        profile,
        company: app.company,
        role: app.role,
        vacancyText: app.vacancyText,
      },
      provider
    )
    app.coverLetterText = text
    await app.save()
    return NextResponse.json({ text })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Неизвестная ошибка"
    return NextResponse.json(
      { error: `Не удалось сгенерировать письмо: ${message}` },
      { status: 502 }
    )
  }
}
