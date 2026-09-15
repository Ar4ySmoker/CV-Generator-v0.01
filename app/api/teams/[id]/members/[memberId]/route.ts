import { NextResponse } from "next/server"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Team } from "@/lib/models/team"

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

  const isOwner = team.ownerId === userId
  const isSelf = memberId === userId

  if (!isOwner && !isSelf) {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 })
  }

  const nextMembers = team.memberIds.filter((m) => m !== memberId)

  if (nextMembers.length === 0) {
    await team.deleteOne()
    return NextResponse.json({ ok: true, removed: true })
  }

  team.memberIds = nextMembers
  if (team.ownerId === memberId) {
    team.ownerId = nextMembers[0]
  }
  await team.save()

  return NextResponse.json({ ok: true })
}
