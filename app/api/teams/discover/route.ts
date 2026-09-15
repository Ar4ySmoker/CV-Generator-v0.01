import { NextResponse } from "next/server"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Team } from "@/lib/models/team"
import { TeamMembership } from "@/lib/models/team-membership"
import { serializeTeam } from "@/lib/team"

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export async function GET(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  await connectDb()

  const url = new URL(request.url)
  const q = url.searchParams.get("q")?.trim() ?? ""
  const domain = url.searchParams.get("domain")?.trim() ?? ""

  const filter: Record<string, unknown> = { visibility: "public" }
  if (q) {
    const re = new RegExp(escapeRegex(q), "i")
    filter.$or = [{ name: re }, { description: re }]
  }
  if (domain) {
    filter.domain = new RegExp(escapeRegex(domain), "i")
  }

  const teams = await Team.find(filter).sort({ createdAt: -1 }).limit(50)
  const teamIds = teams.map((t) => t._id.toString())

  const memberships = await TeamMembership.find({
    teamId: { $in: teamIds },
    status: "active",
  })

  const countMap = new Map<string, number>()
  const myRoles = new Map<string, string>()
  for (const m of memberships) {
    countMap.set(m.teamId, (countMap.get(m.teamId) ?? 0) + 1)
    if (m.userId === userId) myRoles.set(m.teamId, m.role)
  }

  return NextResponse.json({
    teams: teams.map((t) => ({
      ...serializeTeam(t),
      memberCount: countMap.get(t._id.toString()) ?? 0,
      myRole: myRoles.get(t._id.toString()) ?? null,
    })),
  })
}
