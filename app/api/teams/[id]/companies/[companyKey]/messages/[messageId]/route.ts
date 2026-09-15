import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { TeamMessage } from "@/lib/models/team-message"
import { isTeamMember } from "@/lib/team"

const messageSchema = z.object({
  text: z.string().trim().min(1, "Напишите сообщение").max(2000),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; companyKey: string; messageId: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id, messageId } = await params

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

  const message = await TeamMessage.findById(messageId)
  if (!message || message.teamId !== id) {
    return NextResponse.json({ error: "Сообщение не найдено" }, { status: 404 })
  }
  if (message.authorId !== userId) {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 })
  }

  message.text = parsed.data.text
  await message.save()

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; companyKey: string; messageId: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id, messageId } = await params
  await connectDb()

  if (!(await isTeamMember(userId, id))) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 })
  }

  const message = await TeamMessage.findById(messageId)
  if (!message || message.teamId !== id) {
    return NextResponse.json({ error: "Сообщение не найдено" }, { status: 404 })
  }
  if (message.authorId !== userId) {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 })
  }

  await message.deleteOne()

  return NextResponse.json({ ok: true })
}
