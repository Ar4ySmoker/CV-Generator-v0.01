import { NextResponse } from "next/server"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Team } from "@/lib/models/team"
import { generateInviteCode, myRoleIn, serializeTeam } from "@/lib/team"

export async function POST(
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

  let inviteCode = generateInviteCode()
  while (await Team.findOne({ inviteCode })) {
    inviteCode = generateInviteCode()
  }

  team.inviteCode = inviteCode
  await team.save()

  return NextResponse.json({ team: serializeTeam(team) })
}
