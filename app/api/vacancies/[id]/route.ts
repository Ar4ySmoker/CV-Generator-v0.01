import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Team } from "@/lib/models/team"
import { Vacancy } from "@/lib/models/vacancy"
import { VacancyStatus } from "@/lib/models/vacancy-status"
import { serializeVacancy } from "@/lib/vacancy-serialize"

function cleanOptional<T>(v: T | null | undefined): T | undefined {
  return v == null ? undefined : v
}

const updateSchema = z.object({
  company: z.string().trim().min(1).max(120).optional(),
  role: z.string().trim().min(1).max(120).optional(),
  country: z.string().trim().nullable().optional(),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  currency: z.string().trim().nullable().optional(),
  sourceUrl: z.string().trim().nullable().optional(),
  sourceType: z.string().trim().nullable().optional(),
  tags: z.array(z.string().trim().max(30)).max(10).optional(),
  description: z.string().trim().nullable().optional(),
})

async function teamNameOf(teamId?: string): Promise<string | null> {
  if (!teamId) return null
  const team = await Team.findById(teamId)
  return team ? team.name : null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id } = await params
  await connectDb()

  const vacancy = await Vacancy.findById(id)
  if (!vacancy) {
    return NextResponse.json({ error: "Вакансия не найдена" }, { status: 404 })
  }

  const status = await VacancyStatus.findOne({ userId, vacancyId: id })
  const teamName = await teamNameOf(vacancy.teamId)

  return NextResponse.json({
    vacancy: {
      ...serializeVacancy(vacancy),
      status: status?.status ?? null,
      applicationId: status?.applicationId ?? null,
      teamName,
    },
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  await connectDb()

  const vacancy = await Vacancy.findById(id)
  if (!vacancy) {
    return NextResponse.json({ error: "Вакансия не найдена" }, { status: 404 })
  }
  if (vacancy.createdById !== userId) {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 })
  }

  const d = parsed.data
  if (d.company !== undefined) vacancy.company = d.company
  if (d.role !== undefined) vacancy.role = d.role
  if (d.country !== undefined) vacancy.country = cleanOptional(d.country)
  if (d.salaryMin !== undefined) vacancy.salaryMin = cleanOptional(d.salaryMin)
  if (d.salaryMax !== undefined) vacancy.salaryMax = cleanOptional(d.salaryMax)
  if (d.currency !== undefined) vacancy.currency = cleanOptional(d.currency)
  if (d.sourceUrl !== undefined) vacancy.sourceUrl = cleanOptional(d.sourceUrl)
  if (d.sourceType !== undefined) vacancy.sourceType = cleanOptional(d.sourceType)
  if (d.tags !== undefined) vacancy.tags = d.tags
  if (d.description !== undefined) vacancy.description = cleanOptional(d.description)

  await vacancy.save()

  return NextResponse.json({ vacancy: serializeVacancy(vacancy) })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id } = await params
  await connectDb()

  const vacancy = await Vacancy.findById(id)
  if (!vacancy) {
    return NextResponse.json({ error: "Вакансия не найдена" }, { status: 404 })
  }
  if (vacancy.createdById !== userId) {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 })
  }

  await VacancyStatus.deleteMany({ vacancyId: id })
  await vacancy.deleteOne()

  return NextResponse.json({ ok: true })
}
