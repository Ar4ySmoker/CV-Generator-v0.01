import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Team } from "@/lib/models/team"
import { TeamMembership } from "@/lib/models/team-membership"
import { generateInviteCode, listMyTeams, serializeTeam } from "@/lib/team"

const createSchema = z.object({
  name: z.string().trim().min(1, "Укажите название команды").max(80),
  description: z.string().trim().max(300).optional(),
  tags: z.array(z.string().trim().max(30)).max(10).optional(),
  domain: z.string().trim().max(80).optional(),
  visibility: z.enum(["public", "private"]).optional(),
  joinMode: z.enum(["open", "request"]).optional(),
})

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  await connectDb()
  const teams = await listMyTeams(userId)

  return NextResponse.json({ teams })
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

  let inviteCode = generateInviteCode()
  while (await Team.findOne({ inviteCode })) {
    inviteCode = generateInviteCode()
  }

  const team = await Team.create({
    name: parsed.data.name,
    description: parsed.data.description,
    tags: parsed.data.tags,
    domain: parsed.data.domain,
    visibility: parsed.data.visibility ?? "private",
    joinMode: parsed.data.joinMode ?? "request",
    inviteCode,
  })

  await TeamMembership.create({
    userId,
    teamId: team._id.toString(),
    role: "owner",
    status: "active",
  })

  return NextResponse.json(
    { team: { ...serializeTeam(team), role: "owner" } },
    { status: 201 }
  )
}
