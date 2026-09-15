import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Team } from "@/lib/models/team"
import { TeamMembership } from "@/lib/models/team-membership"
import { User } from "@/lib/models/user"
import { myRoleIn, serializeTeam } from "@/lib/team"

const updateSchema = z.object({
  name: z.string().trim().min(1, "Укажите название команды").max(80).optional(),
  description: z.string().trim().max(300).nullable().optional(),
  tags: z.array(z.string().trim().max(30)).max(10).optional(),
  domain: z.string().trim().max(80).nullable().optional(),
  visibility: z.enum(["public", "private"]).optional(),
  joinMode: z.enum(["open", "request"]).optional(),
})

async function membersWithNames(teamId: string) {
  const memberships = await TeamMembership.find({ teamId, status: "active" })
  const userIds = memberships.map((m) => m.userId)
  const users = await User.find({ _id: { $in: userIds } })
  const userMap = new Map(users.map((u) => [u._id.toString(), u]))
  return memberships.map((m) => {
    const u = userMap.get(m.userId)
    return {
      id: m.userId,
      name: u?.name || u?.email || "Участник",
      email: u?.email ?? null,
      role: m.role,
    }
  })
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

  const team = await Team.findById(id)
  if (!team) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 })
  }

  const role = await myRoleIn(userId, id)
  if (!role && team.visibility !== "public") {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 })
  }

  const members = await membersWithNames(id)
  return NextResponse.json({ team: serializeTeam(team), role, members })
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

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  await connectDb()

  const team = await Team.findById(id)
  if (!team) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 })
  }

  if ((await myRoleIn(userId, id)) !== "owner") {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 })
  }

  const d = parsed.data
  if (d.name !== undefined) team.name = d.name
  if (d.description !== undefined) team.description = d.description ?? undefined
  if (d.tags !== undefined) team.tags = d.tags
  if (d.domain !== undefined) team.domain = d.domain ?? undefined
  if (d.visibility !== undefined) team.visibility = d.visibility
  if (d.joinMode !== undefined) team.joinMode = d.joinMode

  await team.save()

  return NextResponse.json({ team: serializeTeam(team) })
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

  const team = await Team.findById(id)
  if (!team) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 })
  }

  if ((await myRoleIn(userId, id)) !== "owner") {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 })
  }

  await TeamMembership.deleteMany({ teamId: id })
  await team.deleteOne()

  return NextResponse.json({ ok: true })
}
