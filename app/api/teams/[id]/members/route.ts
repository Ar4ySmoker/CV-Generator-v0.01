import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Team } from "@/lib/models/team"
import { TeamMembership } from "@/lib/models/team-membership"
import { myRoleIn } from "@/lib/team"

const inviteSchema = z.object({
  userId: z.string().min(1),
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

  const parsed = inviteSchema.safeParse(body)
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

  await TeamMembership.updateOne(
    { userId: parsed.data.userId, teamId: id },
    {
      $set: {
        role: parsed.data.role ?? "member",
        status: "active",
      },
    },
    { upsert: true }
  )

  return NextResponse.json({ ok: true })
}
