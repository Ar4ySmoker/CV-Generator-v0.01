import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Team } from "@/lib/models/team"
import { removeFromAnyTeam, serializeTeam } from "@/lib/team"

const joinSchema = z.object({
  code: z.string().trim().min(1, "Введите код приглашения"),
})

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

  const parsed = joinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  await connectDb()

  const team = await Team.findOne({ inviteCode: parsed.data.code })
  if (!team) {
    return NextResponse.json({ error: "Неверный код приглашения" }, { status: 404 })
  }

  await removeFromAnyTeam(userId)

  if (!team.memberIds.includes(userId)) {
    team.memberIds.push(userId)
    await team.save()
  }

  return NextResponse.json({ team: serializeTeam(team) })
}
