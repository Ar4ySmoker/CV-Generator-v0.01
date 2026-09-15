import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Team } from "@/lib/models/team"
import { User } from "@/lib/models/user"
import { serializeTeam } from "@/lib/team"

const updateSchema = z.object({
  name: z.string().trim().min(1, "Укажите название команды").max(80).optional(),
})

async function membersWithNames(team: {
  ownerId: string
  memberIds: string[]
}) {
  const users = await User.find({ _id: { $in: team.memberIds } })
  return team.memberIds.map((id) => {
    const u = users.find((x) => x._id.toString() === id)
    return {
      id,
      name: u?.name || u?.email || "Участник",
      email: u?.email ?? null,
      isOwner: id === team.ownerId,
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
  if (!team || !team.memberIds.includes(userId)) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 })
  }

  const members = await membersWithNames(team)
  return NextResponse.json({ team: serializeTeam(team), members })
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
  if (!team || team.ownerId !== userId) {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 })
  }

  if (parsed.data.name !== undefined) team.name = parsed.data.name
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
  if (!team || team.ownerId !== userId) {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 })
  }

  await team.deleteOne()
  return NextResponse.json({ ok: true })
}
