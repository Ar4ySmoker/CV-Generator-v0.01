import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { PushSubscription } from "@/lib/models/push-subscription"

const subscribeSchema = z.object({
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 })
  }

  const parsed = subscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректная подписка" }, { status: 400 })
  }

  const { endpoint, keys } = parsed.data
  await connectDb()

  await PushSubscription.findOneAndUpdate(
    { endpoint },
    { userId, endpoint, keys },
    { upsert: true }
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 })
  }

  const parsed = z.object({ endpoint: z.string().min(1) }).safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректная подписка" }, { status: 400 })
  }

  await connectDb()
  await PushSubscription.deleteOne({ userId, endpoint: parsed.data.endpoint })

  return NextResponse.json({ ok: true })
}
