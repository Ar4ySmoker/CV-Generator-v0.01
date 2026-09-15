import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Team } from "@/lib/models/team"
import { TeamMembership } from "@/lib/models/team-membership"
import { myRoleIn } from "@/lib/team"

const roleSchema = z.object({
  role: z.enum(["member", "mentor", "reviewer"]),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id, memberId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 })
  }

  const parsed = roleSchema.safeParse(body)
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

  const membership = await TeamMembership.findOne({
    userId: memberId,
    teamId: id,
  })
  if (!membership || membership.role === "owner") {
    return NextResponse.json({ error: "Нельзя изменить роль владельца" }, { status: 400 })
  }

  membership.role = parsed.data.role
  await membership.save()

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id, memberId } = await params
  await connectDb()

  const team = await Team.findById(id)
  if (!team) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 })
  }

  const role = await myRoleIn(userId, id)
  const isOwner = role === "owner"
  const isSelf = memberId === userId

  if (!isOwner && !isSelf) {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 })
  }

  const membership = await TeamMembership.findOne({ userId: memberId, teamId: id })
  if (membership) {
    if (membership.role === "owner") {
      return NextResponse.json({ error: "Владелец не может покинуть команду" }, { status: 400 })
    }
    await membership.deleteOne()
  }

  return NextResponse.json({ ok: true })
}
