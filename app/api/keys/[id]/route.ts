import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { encrypt } from "@/lib/encryption"
import { ApiKey } from "@/lib/models/api-key"
import { keyHint } from "@/lib/providers"

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "")
}

const updateKeySchema = z.object({
  provider: z.string().trim().min(1).optional(),
  label: z.string().trim().max(120).optional(),
  baseUrl: z
    .string()
    .trim()
    .min(1)
    .refine((v) => /^https?:\/\//i.test(v), "Base URL должен начинаться с http(s)")
    .optional(),
  model: z.string().trim().min(1).optional(),
  apiKey: z.string().trim().min(1).optional(),
  isDefault: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 })
  }

  const parsed = updateKeySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const data = parsed.data
  await connectDb()

  const key = await ApiKey.findOne({ _id: id, userId: session.user.id })
  if (!key) {
    return NextResponse.json({ error: "Ключ не найден" }, { status: 404 })
  }

  if (data.provider !== undefined) key.provider = data.provider
  if (data.label !== undefined) key.label = data.label.trim()
  if (data.baseUrl !== undefined) key.baseUrl = normalizeBaseUrl(data.baseUrl)
  if (data.model !== undefined) key.modelName = data.model.trim()

  if (data.apiKey !== undefined) {
    const apiKey = data.apiKey.trim()
    key.apiKeyEnc = encrypt(apiKey)
    key.keyHint = keyHint(apiKey)
  }

  if (data.isDefault === true) {
    await ApiKey.updateMany(
      { userId: session.user.id },
      { isDefault: false }
    )
    key.isDefault = true
  }

  await key.save()

  return NextResponse.json({
    key: {
      id: key._id.toString(),
      provider: key.provider,
      label: key.label,
      baseUrl: key.baseUrl,
      model: key.modelName,
      keyHint: key.keyHint,
      isDefault: key.isDefault,
    },
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id } = await params
  await connectDb()

  const key = await ApiKey.findOne({ _id: id, userId: session.user.id })
  if (!key) {
    return NextResponse.json({ error: "Ключ не найден" }, { status: 404 })
  }

  const wasDefault = key.isDefault
  await key.deleteOne()

  if (wasDefault) {
    const next = await ApiKey.findOne({ userId: session.user.id }).sort({
      createdAt: -1,
    })
    if (next) {
      next.isDefault = true
      await next.save()
    }
  }

  return NextResponse.json({ ok: true })
}
