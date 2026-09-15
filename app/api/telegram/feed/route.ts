import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { TelegramChannel } from "@/lib/models/telegram-channel"
import { getFeedPosts } from "@/lib/telegram-feed"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  await connectDb()
  const channels = await TelegramChannel.find({})
  const usernames = channels.map((c) => c.username)

  if (usernames.length === 0) {
    return NextResponse.json({ posts: [], errors: [] })
  }

  const force = new URL(request.url).searchParams.get("refresh") === "1"
  const { posts, errors } = await getFeedPosts(usernames, force)

  return NextResponse.json({ posts, errors })
}
