import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { TeamMessage } from "@/lib/models/team-message"
import { User } from "@/lib/models/user"
import { isTeamMember, normalizeCompany } from "@/lib/team"

const messageSchema = z.object({
  text: z.string().trim().min(1, "Напишите сообщение").max(2000),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; companyKey: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id, companyKey } = await params
  await connectDb()

  if (!(await isTeamMember(userId, id))) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 })
  }

  const key = normalizeCompany(companyKey)
  const messages = await TeamMessage.find({ teamId: id, companyKey: key }).sort({
    createdAt: 1,
  })

  const authorIds = [...new Set(messages.map((m) => m.authorId))]
  const users = await User.find({ _id: { $in: authorIds } })
  const userMap = new Map(users.map((u) => [u._id.toString(), u]))

  return NextResponse.json({
    messages: messages.map((m) => {
      const u = userMap.get(m.authorId)
      return {
        id: m._id.toString(),
        authorId: m.authorId,
        authorName: u?.name || u?.email || "Участник",
        text: m.text,
        createdAt: m.createdAt,
      }
    }),
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; companyKey: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id, companyKey } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 })
  }

  const parsed = messageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  await connectDb()

  if (!(await isTeamMember(userId, id))) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 })
  }

  const key = normalizeCompany(companyKey)
  const created = await TeamMessage.create({
    teamId: id,
    companyKey: key,
    authorId: userId,
    text: parsed.data.text,
  })

  return NextResponse.json(
    {
      message: {
        id: created._id.toString(),
        authorId: created.authorId,
        text: created.text,
        createdAt: created.createdAt,
      },
    },
    { status: 201 }
  )
}
