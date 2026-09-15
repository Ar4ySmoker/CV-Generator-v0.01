import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { TeamMembership } from "@/lib/models/team-membership"
import { myRoleIn } from "@/lib/team"

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id, requestId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 })
  }

  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  await connectDb()

  if ((await myRoleIn(userId, id)) !== "owner") {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 })
  }

  const req = await TeamMembership.findOne({
    _id: requestId,
    teamId: id,
    status: "requested",
  })
  if (!req) {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 })
  }

  if (parsed.data.action === "approve") {
    req.status = "active"
    await req.save()
  } else {
    await req.deleteOne()
  }

  return NextResponse.json({ ok: true })
}
