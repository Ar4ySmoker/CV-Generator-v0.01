import { NextResponse } from "next/server"

import { profileUpdateSchema } from "@/lib/api-schemas"
import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Profile } from "@/lib/models/profile"

export async function PATCH(
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

  const parsed = profileUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const data = parsed.data
  await connectDb()

  const profile = await Profile.findOne({ _id: id, userId })
  if (!profile) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 })
  }

  if (data.label !== undefined) profile.label = data.label
  if (data.data !== undefined) profile.data = data.data

  if (data.isDefault === true) {
    await Profile.updateMany({ userId }, { isDefault: false })
    profile.isDefault = true
  }

  await profile.save()

  return NextResponse.json({
    profile: {
      id: profile._id.toString(),
      label: profile.label,
      isDefault: profile.isDefault,
      data: profile.data,
      updatedAt: profile.updatedAt,
    },
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id } = await params
  await connectDb()

  const profile = await Profile.findOne({ _id: id, userId })
  if (!profile) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 })
  }

  const wasDefault = profile.isDefault
  await profile.deleteOne()

  if (wasDefault) {
    const next = await Profile.findOne({ userId }).sort({ updatedAt: -1 })
    if (next) {
      next.isDefault = true
      await next.save()
    }
  }

  return NextResponse.json({ ok: true })
}
