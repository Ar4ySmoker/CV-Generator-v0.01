import { NextResponse } from "next/server"

import { themeCreateSchema } from "@/lib/api-schemas"
import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { CvTheme } from "@/lib/models/cv-theme"

function serialize(t: {
  _id: unknown
  name: string
  font: string
  accent: string
  body: string
  gray: string
  heading: string
  accentRule: boolean
  isDefault: boolean
  updatedAt: Date
}) {
  return {
    id: (t._id as { toString(): string }).toString(),
    name: t.name,
    font: t.font,
    accent: t.accent,
    body: t.body,
    gray: t.gray,
    heading: t.heading,
    accentRule: t.accentRule,
    isDefault: t.isDefault,
    updatedAt: t.updatedAt,
  }
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  await connectDb()
  const themes = await CvTheme.find({ userId }).sort({
    isDefault: -1,
    updatedAt: -1,
  })

  return NextResponse.json({ themes: themes.map(serialize) })
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

  const parsed = themeCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const data = parsed.data
  await connectDb()

  const count = await CvTheme.countDocuments({ userId })
  const makeDefault = data.isDefault === true || count === 0
  if (makeDefault) {
    await CvTheme.updateMany({ userId }, { isDefault: false })
  }

  const created = await CvTheme.create({
    userId,
    name: data.name,
    font: data.font,
    accent: data.accent,
    body: data.body,
    gray: data.gray,
    heading: data.heading,
    accentRule: data.accentRule,
    isDefault: makeDefault,
  })

  return NextResponse.json({ theme: serialize(created) }, { status: 201 })
}
