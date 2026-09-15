import { NextResponse } from "next/server"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { TeamActivity } from "@/lib/models/team-activity"
import { User } from "@/lib/models/user"
import { isTeamMember } from "@/lib/team"

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

  if (!(await isTeamMember(userId, id))) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 })
  }

  const activities = await TeamActivity.find({ teamId: id })
    .sort({ createdAt: -1 })
    .limit(50)

  const actorIds = [...new Set(activities.map((a) => a.actorId))]
  const users = await User.find({ _id: { $in: actorIds } })
  const userMap = new Map(users.map((u) => [u._id.toString(), u]))

  return NextResponse.json({
    activities: activities.map((a) => {
      const u = userMap.get(a.actorId)
      return {
        id: a._id.toString(),
        type: a.type,
        actorId: a.actorId,
        actorName: u?.name || u?.email || "Участник",
        applicationId: a.applicationId ?? null,
        company: a.company ?? null,
        role: a.role ?? null,
        stageName: a.stageName ?? null,
        feedbackKind: a.feedbackKind ?? null,
        createdAt: a.createdAt,
      }
    }),
  })
}
