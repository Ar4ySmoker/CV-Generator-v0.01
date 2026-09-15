import { NextResponse } from "next/server"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { User } from "@/lib/models/user"

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export async function GET(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? ""
  if (!q) {
    return NextResponse.json({ users: [] })
  }

  await connectDb()

  const isEmail = q.includes("@")
  const filter: Record<string, unknown> = { _id: { $ne: userId } }
  if (isEmail) {
    filter.email = q.toLowerCase()
  } else {
    filter.name = new RegExp(escapeRegex(q), "i")
  }

  const users = await User.find(filter).limit(10)

  return NextResponse.json({
    users: users.map((u) => ({
      id: u._id.toString(),
      name: u.name || u.email || "Пользователь",
      email: isEmail ? u.email : null,
    })),
  })
}
