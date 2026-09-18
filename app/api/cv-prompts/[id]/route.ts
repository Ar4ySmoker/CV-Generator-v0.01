import { NextResponse } from "next/server"

import { promptUpdateSchema } from "@/lib/api-schemas"
import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { CvPrompt } from "@/lib/models/cv-prompt"

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

  const parsed = promptUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const data = parsed.data
  await connectDb()

  const prompt = await CvPrompt.findOne({ _id: id, userId })
  if (!prompt) {
    return NextResponse.json({ error: "Промт не найден" }, { status: 404 })
  }

  if (data.name !== undefined) prompt.name = data.name
  if (data.content !== undefined) prompt.content = data.content

  if (data.isDefault === true) {
    await CvPrompt.updateMany({ userId }, { isDefault: false })
    prompt.isDefault = true
  }

  await prompt.save()

  return NextResponse.json({
    prompt: {
      id: prompt._id.toString(),
      name: prompt.name,
      content: prompt.content,
      isDefault: prompt.isDefault,
      updatedAt: prompt.updatedAt,
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

  const prompt = await CvPrompt.findOne({ _id: id, userId })
  if (!prompt) {
    return NextResponse.json({ error: "Промт не найден" }, { status: 404 })
  }

  const wasDefault = prompt.isDefault
  await prompt.deleteOne()

  if (wasDefault) {
    const next = await CvPrompt.findOne({ userId }).sort({ updatedAt: -1 })
    if (next) {
      next.isDefault = true
      await next.save()
    }
  }

  return NextResponse.json({ ok: true })
}
