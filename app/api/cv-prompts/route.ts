import { NextResponse } from "next/server"

import { promptCreateSchema } from "@/lib/api-schemas"
import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { CvPrompt } from "@/lib/models/cv-prompt"

function serialize(p: {
  _id: unknown
  name: string
  content: string
  isDefault: boolean
  updatedAt: Date
}) {
  return {
    id: (p._id as { toString(): string }).toString(),
    name: p.name,
    content: p.content,
    isDefault: p.isDefault,
    updatedAt: p.updatedAt,
  }
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  await connectDb()
  const prompts = await CvPrompt.find({ userId }).sort({
    isDefault: -1,
    updatedAt: -1,
  })

  return NextResponse.json({ prompts: prompts.map(serialize) })
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

  const parsed = promptCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const data = parsed.data
  await connectDb()

  const count = await CvPrompt.countDocuments({ userId })
  const makeDefault = data.isDefault === true || count === 0
  if (makeDefault) {
    await CvPrompt.updateMany({ userId }, { isDefault: false })
  }

  const created = await CvPrompt.create({
    userId,
    name: data.name,
    content: data.content,
    isDefault: makeDefault,
  })

  return NextResponse.json({ prompt: serialize(created) }, { status: 201 })
}
