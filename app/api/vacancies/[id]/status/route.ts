import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Vacancy } from "@/lib/models/vacancy"
import { VacancyStatus } from "@/lib/models/vacancy-status"

const statusSchema = z.object({
  status: z.enum(["saved", "applied", "skipped"]),
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

  const parsed = statusSchema.safeParse(body)
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

  const status = parsed.data.status
  const update: Record<string, unknown> = { $set: { status } }
  if (status !== "applied") {
    update.$unset = { applicationId: "" }
  }
  await VacancyStatus.updateOne({ userId, vacancyId: id }, update, {
    upsert: true,
  })

  return NextResponse.json({ ok: true, status })
}
