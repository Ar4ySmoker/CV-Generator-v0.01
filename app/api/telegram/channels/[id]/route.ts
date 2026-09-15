import { NextResponse } from "next/server"

import { isAdminEmail } from "@/lib/admin"
import { auth } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { TelegramChannel } from "@/lib/models/telegram-channel"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }
  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Нет прав" }, { status: 403 })
  }

  const { id } = await params
  await connectDb()

  await TelegramChannel.deleteOne({ _id: id })

  return NextResponse.json({ ok: true })
}
