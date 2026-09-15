import { NextResponse } from "next/server"

import { profileCreateSchema } from "@/lib/api-schemas"
import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Profile } from "@/lib/models/profile"

function serialize(p: {
  _id: unknown
  label: string
  isDefault: boolean
  data: unknown
  updatedAt: Date
}) {
  return {
    id: (p._id as { toString(): string }).toString(),
    label: p.label,
    isDefault: p.isDefault,
    data: p.data,
    updatedAt: p.updatedAt,
  }
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  await connectDb()
  const profiles = await Profile.find({ userId }).sort({
    isDefault: -1,
    updatedAt: -1,
  })

  return NextResponse.json({ profiles: profiles.map(serialize) })
}

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

  const parsed = profileCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const data = parsed.data
  await connectDb()

  const count = await Profile.countDocuments({ userId })
  const makeDefault = data.isDefault === true || count === 0
  if (makeDefault) {
    await Profile.updateMany({ userId }, { isDefault: false })
  }

  const created = await Profile.create({
    userId,
    label: data.label,
    data: data.data,
    isDefault: makeDefault,
  })

  return NextResponse.json({ profile: serialize(created) }, { status: 201 })
}
