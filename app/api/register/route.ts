import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { connectDb } from "@/lib/db"
import { User } from "@/lib/models/user"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Пароль должен быть не короче 8 символов"),
  name: z.string().trim().max(120).optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const { email, password, name } = parsed.data

  try {
    await connectDb()
  } catch {
    return NextResponse.json({ error: "Ошибка подключения к БД" }, { status: 500 })
  }

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) {
    return NextResponse.json(
      { error: "Пользователь с таким email уже существует" },
      { status: 409 }
    )
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await User.create({
    email: email.toLowerCase(),
    passwordHash,
    name: name?.trim() ?? "",
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
