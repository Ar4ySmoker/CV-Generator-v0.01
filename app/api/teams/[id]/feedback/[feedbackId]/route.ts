import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { VacancyFeedback } from "@/lib/models/vacancy-feedback"
import { isTeamMember } from "@/lib/team"

const updateSchema = z.object({
  kind: z.enum(["questions", "tips", "general"]).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  text: z.string().trim().min(1, "Напишите текст отзыва").max(2000).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; feedbackId: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id, feedbackId } = await params

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

  if (!(await isTeamMember(userId, id))) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 })
  }

  const feedback = await VacancyFeedback.findById(feedbackId)
  if (!feedback || feedback.teamId !== id) {
    return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 })
  }
  if (feedback.authorId !== userId) {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 })
  }

  const d = parsed.data
  if (d.kind !== undefined) feedback.kind = d.kind
  if (d.rating !== undefined) {
    feedback.rating = d.rating ?? undefined
  }
  if (d.text !== undefined) feedback.text = d.text

  await feedback.save()

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; feedbackId: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id, feedbackId } = await params
  await connectDb()

  if (!(await isTeamMember(userId, id))) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 })
  }

  const feedback = await VacancyFeedback.findById(feedbackId)
  if (!feedback || feedback.teamId !== id) {
    return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 })
  }
  if (feedback.authorId !== userId) {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 })
  }

  await feedback.deleteOne()

  return NextResponse.json({ ok: true })
}
