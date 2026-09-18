import { NextResponse } from "next/server"

import { themeUpdateSchema } from "@/lib/api-schemas"
import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { CvTheme } from "@/lib/models/cv-theme"

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

  const parsed = themeUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const data = parsed.data
  await connectDb()

  const theme = await CvTheme.findOne({ _id: id, userId })
  if (!theme) {
    return NextResponse.json({ error: "Тема не найдена" }, { status: 404 })
  }

  if (data.name !== undefined) theme.name = data.name
  if (data.font !== undefined) theme.font = data.font
  if (data.accent !== undefined) theme.accent = data.accent
  if (data.body !== undefined) theme.body = data.body
  if (data.gray !== undefined) theme.gray = data.gray
  if (data.heading !== undefined) theme.heading = data.heading
  if (data.accentRule !== undefined) theme.accentRule = data.accentRule

  if (data.isDefault === true) {
    await CvTheme.updateMany({ userId }, { isDefault: false })
    theme.isDefault = true
  }

  await theme.save()

  return NextResponse.json({
    theme: {
      id: theme._id.toString(),
      name: theme.name,
      font: theme.font,
      accent: theme.accent,
      body: theme.body,
      gray: theme.gray,
      heading: theme.heading,
      accentRule: theme.accentRule,
      isDefault: theme.isDefault,
      updatedAt: theme.updatedAt,
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

  const theme = await CvTheme.findOne({ _id: id, userId })
  if (!theme) {
    return NextResponse.json({ error: "Тема не найдена" }, { status: 404 })
  }

  const wasDefault = theme.isDefault
  await theme.deleteOne()

  if (wasDefault) {
    const next = await CvTheme.findOne({ userId }).sort({ updatedAt: -1 })
    if (next) {
      next.isDefault = true
      await next.save()
    }
  }

  return NextResponse.json({ ok: true })
}
