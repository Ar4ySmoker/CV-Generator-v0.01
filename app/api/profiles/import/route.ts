import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Profile } from "@/lib/models/profile"
import { parseProfileSource } from "@/lib/profile-import"

const importSchema = z.object({
  label: z.string().trim().min(1, "Укажите название профиля").max(120),
  raw: z.string().min(1, "Вставьте содержимое файла"),
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

  const parsed = importSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const { label, raw } = parsed.data

  let data
  try {
    data = parseProfileSource(raw)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Не удалось разобрать профиль" },
      { status: 400 }
    )
  }

  await connectDb()

  const count = await Profile.countDocuments({ userId })
  const makeDefault = count === 0
  if (makeDefault) {
    await Profile.updateMany({ userId }, { isDefault: false })
  }

  const created = await Profile.create({
    userId,
    label,
    data,
    isDefault: makeDefault,
  })

  return NextResponse.json(
    {
      profile: {
        id: created._id.toString(),
        label: created.label,
        isDefault: created.isDefault,
      },
    },
    { status: 201 }
  )
}
