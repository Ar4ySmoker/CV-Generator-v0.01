import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Team } from "@/lib/models/team"
import { TeamMembership } from "@/lib/models/team-membership"
import { User } from "@/lib/models/user"
import { myRoleIn } from "@/lib/team"

const requestSchema = z.object({
  role: z.enum(["member", "mentor", "reviewer"]).optional(),
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

  const parsed = requestSchema.safeParse(body)
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
  if (team.visibility !== "public") {
    return NextResponse.json(
      { error: "Команда закрытая — вступить можно только по приглашению" },
      { status: 403 }
    )
  }

  const existing = await TeamMembership.findOne({ userId, teamId: id })
  if (existing && existing.status === "active") {
    return NextResponse.json({ error: "Вы уже в команде" }, { status: 409 })
  }

  const role = parsed.data.role ?? "member"
  const status = team.joinMode === "open" ? "active" : "requested"

  if (existing) {
    existing.role = role
    existing.status = status
    await existing.save()
  } else {
    await TeamMembership.create({
      userId,
      teamId: id,
      role,
      status,
    })
  }

  return NextResponse.json({ joined: status === "active" }, { status: 201 })
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

  if ((await myRoleIn(userId, id)) !== "owner") {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 })
  }

  const requests = await TeamMembership.find({ teamId: id, status: "requested" })
  const userIds = requests.map((r) => r.userId)
  const users = await User.find({ _id: { $in: userIds } })
  const userMap = new Map(users.map((u) => [u._id.toString(), u]))

  return NextResponse.json({
    requests: requests.map((r) => {
      const u = userMap.get(r.userId)
      return {
        id: r._id.toString(),
        userId: r.userId,
        name: u?.name || u?.email || "Участник",
        email: u?.email ?? null,
        role: r.role,
        createdAt: r.createdAt,
      }
    }),
  })
}
