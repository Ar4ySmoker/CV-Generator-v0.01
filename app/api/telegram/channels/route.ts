import { NextResponse } from "next/server"
import { z } from "zod"

import { isAdminEmail } from "@/lib/admin"
import { auth } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { TelegramChannel } from "@/lib/models/telegram-channel"
import { normalizeChannelUsername } from "@/lib/telegram-feed"

const createSchema = z.object({
  username: z.string().trim().min(1, "Укажите канал").max(64),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  await connectDb()
  const channels = await TelegramChannel.find({}).sort({ createdAt: -1 })

  return NextResponse.json({
    channels: channels.map((c) => ({ id: c._id.toString(), username: c.username })),
    isAdmin: isAdminEmail(session.user.email),
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }
  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const username = normalizeChannelUsername(parsed.data.username)
  if (!username) {
    return NextResponse.json({ error: "Некорректное имя канала" }, { status: 400 })
  }

  await connectDb()

  const existing = await TelegramChannel.findOne({ username })
  if (existing) {
    return NextResponse.json(
      { channel: { id: existing._id.toString(), username: existing.username } },
      { status: 200 }
    )
  }

  const created = await TelegramChannel.create({
    username,
    createdBy: session.user.id,
  })

  return NextResponse.json(
    { channel: { id: created._id.toString(), username: created.username } },
    { status: 201 }
  )
}
