import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Team } from "@/lib/models/team"
import { VacancyFeedback } from "@/lib/models/vacancy-feedback"
import { addTeamActivity, normalizeCompany, notifyTeamMembers } from "@/lib/team"

const feedbackSchema = z.object({
  companyKey: z.string().trim().min(1, "Укажите компанию"),
  company: z.string().trim().optional(),
  kind: z.enum(["questions", "tips", "general"]),
  rating: z.number().int().min(1).max(5).optional(),
  text: z.string().trim().min(1, "Напишите текст отзыва").max(2000),
})

export async function POST(
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

  const parsed = feedbackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  await connectDb()

  const team = await Team.findById(id)
  if (!team || !team.memberIds.includes(userId)) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 })
  }

  const created = await VacancyFeedback.create({
    teamId: id,
    companyKey: normalizeCompany(parsed.data.companyKey),
    authorId: userId,
    kind: parsed.data.kind,
    rating: parsed.data.rating,
    text: parsed.data.text,
  })

  const company = parsed.data.company ?? parsed.data.companyKey

  await addTeamActivity({
    teamId: id,
    type: "feedback",
    actorId: userId,
    company,
    feedbackKind: parsed.data.kind,
  })

  await notifyTeamMembers(id, userId, {
    title: "Команда: новый отзыв",
    body: `Новый отзыв о собеседовании: ${company}`,
    url: "/teams",
  })

  return NextResponse.json(
    {
      feedback: {
        id: created._id.toString(),
        authorId: created.authorId,
        kind: created.kind,
        rating: created.rating ?? null,
        text: created.text,
        createdAt: created.createdAt,
      },
    },
    { status: 201 }
  )
}
