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

const createKeySchema = z.object({
  provider: z.string().trim().min(1, "Укажите провайдера"),
  label: z.string().trim().max(120).optional(),
  baseUrl: z
    .string()
    .trim()
    .min(1, "Укажите base URL")
    .refine((v) => /^https?:\/\//i.test(v), "Base URL должен начинаться с http(s)"),
  model: z.string().trim().min(1, "Укажите модель"),
  apiKey: z.string().trim().min(1, "Введите API-ключ"),
  isDefault: z.boolean().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  await connectDb()

  const keys = await ApiKey.find({ userId: session.user.id }).sort({
    isDefault: -1,
    createdAt: -1,
  })

  return NextResponse.json({
    keys: keys.map((k) => ({
      id: k._id.toString(),
      provider: k.provider,
      label: k.label,
      baseUrl: k.baseUrl,
      model: k.modelName,
      keyHint: k.keyHint,
      isDefault: k.isDefault,
    })),
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 })
  }

  const parsed = createKeySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const data = parsed.data
  const userId = session.user.id

  await connectDb()

  const count = await ApiKey.countDocuments({ userId })
  const makeDefault = data.isDefault === true || count === 0

  if (makeDefault) {
    await ApiKey.updateMany({ userId }, { isDefault: false })
  }

  const apiKey = data.apiKey.trim()
  const created = await ApiKey.create({
    userId,
    provider: data.provider,
    label: data.label?.trim() ?? "",
    baseUrl: normalizeBaseUrl(data.baseUrl),
    modelName: data.model.trim(),
    apiKeyEnc: encrypt(apiKey),
    keyHint: keyHint(apiKey),
    isDefault: makeDefault,
  })

  return NextResponse.json(
    {
      key: {
        id: created._id.toString(),
        provider: created.provider,
        label: created.label,
        baseUrl: created.baseUrl,
        model: created.modelName,
        keyHint: created.keyHint,
        isDefault: created.isDefault,
      },
    },
    { status: 201 }
  )
}
