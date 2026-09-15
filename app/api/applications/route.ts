import { NextResponse } from "next/server"

import { applicationCreateSchema } from "@/lib/api-schemas"
import { serializeApplication } from "@/lib/application-serialize"
import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Application } from "@/lib/models/application"
import { listStages, startStageId } from "@/lib/pipeline"

function cleanOptional<T>(v: T | null | undefined): T | undefined {
  return v == null ? undefined : v
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

  return NextResponse.json({ applications: apps.map(serializeApplication) })
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
    companyDomain: cleanOptional(data.companyDomain),
    country: cleanOptional(data.country),
    salaryMin: cleanOptional(data.salaryMin),
    salaryMax: cleanOptional(data.salaryMax),
    currency: cleanOptional(data.currency),
    sourceType: cleanOptional(data.sourceType),
    sourceUrl: cleanOptional(data.sourceUrl),
    vacancyText: cleanOptional(data.vacancyText),
    notes: cleanOptional(data.notes),
    contactIds: data.contactIds ?? [],
    stageId,
    timeline: [
      {
        at: new Date(),
        type: "stage_change",
        stageName: startStage?.name ?? "Черновик",
        stageId,
      },
    ],
  })

  return NextResponse.json({ application: serializeApplication(created) }, { status: 201 })
}
