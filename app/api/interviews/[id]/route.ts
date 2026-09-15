import { NextResponse } from "next/server"

import { interviewUpdateSchema } from "@/lib/api-schemas"
import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Interview } from "@/lib/models/interview"

function cleanOptional<T>(v: T | null | undefined): T | undefined {
  return v == null ? undefined : v
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

  const parsed = interviewUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const data = parsed.data
  await connectDb()

  const interview = await Interview.findOne({ _id: id, userId })
  if (!interview) {
    return NextResponse.json({ error: "Событие не найдено" }, { status: 404 })
  }

  if (data.type !== undefined) interview.type = data.type
  if (data.scheduledAt !== undefined) interview.scheduledAt = new Date(data.scheduledAt)
  if (data.channel !== undefined) interview.channel = cleanOptional(data.channel)
  if (data.note !== undefined) interview.note = cleanOptional(data.note)
  if (data.status !== undefined) interview.status = data.status

  await interview.save()

  return NextResponse.json({
    interview: {
      id: interview._id.toString(),
      applicationId: interview.applicationId,
      type: interview.type,
      scheduledAt: interview.scheduledAt,
      channel: interview.channel ?? null,
      note: interview.note ?? null,
      status: interview.status,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
    },
  })
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

  const interview = await Interview.findOne({ _id: id, userId })
  if (!interview) {
    return NextResponse.json({ error: "Событие не найдено" }, { status: 404 })
  }

  await interview.deleteOne()
  return NextResponse.json({ ok: true })
}
