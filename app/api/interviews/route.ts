import { NextResponse } from "next/server"

import { interviewCreateSchema } from "@/lib/api-schemas"
import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Application } from "@/lib/models/application"
import { Interview, type InterviewDoc } from "@/lib/models/interview"

function cleanOptional<T>(v: T | null | undefined): T | undefined {
  return v == null ? undefined : v
}

function serializeInterview(
  i: InterviewDoc,
  app?: { company: string; role: string } | null
) {
  return {
    id: i._id.toString(),
    applicationId: i.applicationId,
    type: i.type,
    scheduledAt: i.scheduledAt,
    channel: i.channel ?? null,
    note: i.note ?? null,
    status: i.status,
    company: app?.company ?? null,
    role: app?.role ?? null,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  }
}

export async function GET(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  await connectDb()

  const url = new URL(request.url)
  const applicationId = url.searchParams.get("applicationId")?.trim()

  const filter: Record<string, unknown> = { userId }
  if (applicationId) {
    filter.applicationId = applicationId
  }

  const interviews = await Interview.find(filter).sort({ scheduledAt: 1 })

  const apps = await Application.find({ userId }).select("company role")
  const appMap = new Map(apps.map((a) => [a._id.toString(), a]))

  return NextResponse.json({
    interviews: interviews.map((i) =>
      serializeInterview(i, appMap.get(i.applicationId))
    ),
  })
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

  const parsed = interviewCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const data = parsed.data
  await connectDb()

  const app = await Application.findOne({ _id: data.applicationId, userId })
  if (!app) {
    return NextResponse.json({ error: "Отклик не найден" }, { status: 404 })
  }

  const created = await Interview.create({
    userId,
    applicationId: data.applicationId,
    type: data.type,
    scheduledAt: new Date(data.scheduledAt),
    channel: cleanOptional(data.channel),
    note: cleanOptional(data.note),
    status: "scheduled",
  })

  return NextResponse.json(
    { interview: serializeInterview(created, app) },
    { status: 201 }
  )
}
