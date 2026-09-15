import { NextResponse } from "next/server"

import { applicationUpdateSchema } from "@/lib/api-schemas"
import { serializeApplication } from "@/lib/application-serialize"
import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Application } from "@/lib/models/application"
import { PipelineStage } from "@/lib/models/pipeline-stage"

function cleanOptional<T>(v: T | null | undefined): T | undefined {
  return v == null ? undefined : v
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

  const app = await Application.findOne({ _id: id, userId })
  if (!app) {
    return NextResponse.json({ error: "Отклик не найден" }, { status: 404 })
  }

  return NextResponse.json({ application: serializeApplication(app) })
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

  const parsed = applicationUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const data = parsed.data
  await connectDb()

  const app = await Application.findOne({ _id: id, userId })
  if (!app) {
    return NextResponse.json({ error: "Отклик не найден" }, { status: 404 })
  }

  if (data.company !== undefined) app.company = data.company
  if (data.role !== undefined) app.role = data.role
  if (data.companyDomain !== undefined) app.companyDomain = cleanOptional(data.companyDomain)
  if (data.country !== undefined) app.country = cleanOptional(data.country)
  if (data.salaryMin !== undefined) app.salaryMin = cleanOptional(data.salaryMin)
  if (data.salaryMax !== undefined) app.salaryMax = cleanOptional(data.salaryMax)
  if (data.currency !== undefined) app.currency = cleanOptional(data.currency)
  if (data.sourceType !== undefined) app.sourceType = cleanOptional(data.sourceType)
  if (data.sourceUrl !== undefined) app.sourceUrl = cleanOptional(data.sourceUrl)
  if (data.vacancyText !== undefined) app.vacancyText = cleanOptional(data.vacancyText)
  if (data.notes !== undefined) app.notes = cleanOptional(data.notes)
  if (data.contactIds !== undefined) app.contactIds = data.contactIds
  if (data.sentChannel !== undefined) app.sentChannel = cleanOptional(data.sentChannel)
  if (data.sentTo !== undefined) app.sentTo = cleanOptional(data.sentTo)
  if (data.sentAt !== undefined) {
    app.sentAt = data.sentAt ? new Date(data.sentAt) : undefined
  }
  if (data.offerSalary !== undefined) app.offerSalary = cleanOptional(data.offerSalary)
  if (data.offerCurrency !== undefined) app.offerCurrency = cleanOptional(data.offerCurrency)
  if (data.offerBenefits !== undefined) app.offerBenefits = cleanOptional(data.offerBenefits)
  if (data.offerRemote !== undefined) app.offerRemote = cleanOptional(data.offerRemote)
  if (data.archived !== undefined) app.archived = data.archived

  if (data.activity) {
    app.timeline.push({
      at: data.activity.at ? new Date(data.activity.at) : new Date(),
      type: data.activity.type,
      note: cleanOptional(data.activity.note),
      stageId: app.stageId,
    })
    if (data.activity.type === "sent" && !app.sentAt) {
      app.sentAt = new Date()
    }
  }

  if (data.stageId !== undefined && data.stageId !== app.stageId) {
    const stage = await PipelineStage.findById(data.stageId)
    app.timeline.push({
      at: new Date(),
      type: "stage_change",
      stageName: stage?.name ?? "",
      stageId: data.stageId,
    })
    app.stageId = data.stageId
    if (stage?.name === "Отправлено" && !app.sentAt) {
      app.sentAt = new Date()
    }
  }

  await app.save()

  return NextResponse.json({ application: serializeApplication(app) })
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

  const app = await Application.findOne({ _id: id, userId })
  if (!app) {
    return NextResponse.json({ error: "Отклик не найден" }, { status: 404 })
  }

  await app.deleteOne()
  return NextResponse.json({ ok: true })
}
