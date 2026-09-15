import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Team } from "@/lib/models/team"
import { Vacancy } from "@/lib/models/vacancy"
import { VacancyStatus } from "@/lib/models/vacancy-status"
import { serializeVacancy } from "@/lib/vacancy-serialize"
import { fetchVacancyText, VacancyUrlError } from "@/lib/vacancy"

function cleanOptional<T>(v: T | null | undefined): T | undefined {
  return v == null ? undefined : v
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const createSchema = z.object({
  company: z.string().trim().min(1, "Укажите компанию").max(120),
  role: z.string().trim().min(1, "Укажите должность").max(120),
  country: z.string().trim().optional(),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  currency: z.string().trim().optional(),
  sourceUrl: z.string().trim().optional(),
  sourceType: z.string().trim().optional(),
  tags: z.array(z.string().trim().max(30)).max(10).optional(),
  description: z.string().trim().optional(),
})

export async function GET(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  await connectDb()

  const url = new URL(request.url)
  const q = url.searchParams.get("q")?.trim() ?? ""
  const source = url.searchParams.get("source")?.trim()
  const status = url.searchParams.get("status")?.trim()

  const filter: Record<string, unknown> = {}
  if (q) {
    const re = new RegExp(escapeRegex(q), "i")
    filter.$or = [{ company: re }, { role: re }, { description: re }]
  }
  if (source === "manual" || source === "shared") {
    filter.source = source
  }

  const vacancies = await Vacancy.find(filter).sort({ createdAt: -1 }).limit(100)

  const ids = vacancies.map((v) => v._id.toString())
  const statuses = await VacancyStatus.find({ userId, vacancyId: { $in: ids } })
  const statusMap = new Map(statuses.map((s) => [s.vacancyId, s]))

  const teamIds = [
    ...new Set(
      vacancies
        .filter((v) => v.source === "shared" && v.teamId)
        .map((v) => v.teamId as string)
    ),
  ]
  const teams = await Team.find({ _id: { $in: teamIds } })
  const teamMap = new Map(teams.map((t) => [t._id.toString(), t.name]))

  let list = vacancies.map((v) => {
    const my = statusMap.get(v._id.toString())
    return {
      ...serializeVacancy(v),
      status: my?.status ?? null,
      applicationId: my?.applicationId ?? null,
      teamName:
        v.source === "shared" && v.teamId
          ? teamMap.get(v.teamId) ?? null
          : null,
    }
  })

  if (status === "saved" || status === "applied" || status === "skipped") {
    list = list.filter((v) => v.status === status)
  }

  return NextResponse.json({ vacancies: list })
}

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const data = parsed.data
  await connectDb()

  let description = cleanOptional(data.description)
  if (data.sourceUrl && !description) {
    try {
      description = await fetchVacancyText(data.sourceUrl)
    } catch (err) {
      if (err instanceof VacancyUrlError) {
        return NextResponse.json({ error: err.message }, { status: 422 })
      }
      return NextResponse.json(
        { error: "Не удалось загрузить вакансию по ссылке" },
        { status: 422 }
      )
    }
  }

  const created = await Vacancy.create({
    company: data.company,
    role: data.role,
    country: cleanOptional(data.country),
    salaryMin: cleanOptional(data.salaryMin),
    salaryMax: cleanOptional(data.salaryMax),
    currency: cleanOptional(data.currency),
    sourceUrl: cleanOptional(data.sourceUrl),
    sourceType: cleanOptional(data.sourceType),
    tags: data.tags ?? [],
    description,
    source: "manual",
    createdById: userId,
  })

  return NextResponse.json(
    { vacancy: { ...serializeVacancy(created), status: null } },
    { status: 201 }
  )
}
