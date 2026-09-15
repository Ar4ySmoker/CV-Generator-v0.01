import { NextResponse } from "next/server"

import { applicationCreateSchema } from "@/lib/api-schemas"
import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Application, type ApplicationDoc } from "@/lib/models/application"
import { listStages, startStageId } from "@/lib/pipeline"

function cleanOptional<T>(v: T | null | undefined): T | undefined {
  return v == null ? undefined : v
}

export function serializeList(a: ApplicationDoc) {
  return {
    id: a._id.toString(),
    company: a.company,
    role: a.role,
    country: a.country ?? null,
    salaryMin: a.salaryMin ?? null,
    salaryMax: a.salaryMax ?? null,
    currency: a.currency ?? null,
    sourceType: a.sourceType ?? null,
    sourceUrl: a.sourceUrl ?? null,
    cvId: a.cvId ?? null,
    stageId: a.stageId,
    sentChannel: a.sentChannel ?? null,
    sentTo: a.sentTo ?? null,
    sentAt: a.sentAt ?? null,
    nextEventType: a.nextEventType ?? null,
    nextEventAt: a.nextEventAt ?? null,
    nextEventChannel: a.nextEventChannel ?? null,
    offerSalary: a.offerSalary ?? null,
    offerCurrency: a.offerCurrency ?? null,
    archived: a.archived,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }
}

export async function GET(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  await connectDb()

  const url = new URL(request.url)
  const archived = url.searchParams.get("archived") === "1"
  const search = url.searchParams.get("search")?.trim() ?? ""

  const filter: Record<string, unknown> = { userId, archived }
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
    filter.$or = [{ company: re }, { role: re }]
  }

  const apps = await Application.find(filter).sort({ updatedAt: -1 })

  return NextResponse.json({ applications: apps.map(serializeList) })
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

  const parsed = applicationCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const data = parsed.data
  await connectDb()

  const stageId = await startStageId(userId)
  const stages = await listStages(userId)
  const startStage = stages.find((s) => s._id.toString() === stageId)

  const created = await Application.create({
    userId,
    company: data.company,
    role: data.role,
    country: cleanOptional(data.country),
    salaryMin: cleanOptional(data.salaryMin),
    salaryMax: cleanOptional(data.salaryMax),
    currency: cleanOptional(data.currency),
    sourceType: cleanOptional(data.sourceType),
    sourceUrl: cleanOptional(data.sourceUrl),
    vacancyText: cleanOptional(data.vacancyText),
    notes: cleanOptional(data.notes),
    contactName: cleanOptional(data.contactName),
    contactEmail: cleanOptional(data.contactEmail),
    stageId,
    timeline: [
      { at: new Date(), stageName: startStage?.name ?? "Черновик" },
    ],
  })

  return NextResponse.json({ application: serializeList(created) }, { status: 201 })
}
