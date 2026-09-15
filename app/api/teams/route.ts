import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Team } from "@/lib/models/team"
import {
  findTeamOfMember,
  generateInviteCode,
  removeFromAnyTeam,
  serializeTeam,
} from "@/lib/team"

const createSchema = z.object({
  name: z.string().trim().min(1, "Укажите название команды").max(80),
})

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  await connectDb()
  const team = await findTeamOfMember(userId)

  return NextResponse.json({ team: team ? serializeTeam(team) : null })
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

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  await connectDb()

  await removeFromAnyTeam(userId)

  let inviteCode = generateInviteCode()
  while (await Team.findOne({ inviteCode })) {
    inviteCode = generateInviteCode()
  }

  const team = await Team.create({
    name: parsed.data.name,
    ownerId: userId,
    inviteCode,
    memberIds: [userId],
  })

  return NextResponse.json({ team: serializeTeam(team) }, { status: 201 })
}
