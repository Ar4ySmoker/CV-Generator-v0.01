import { NextResponse } from "next/server"

import { contactCreateSchema } from "@/lib/api-schemas"
import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Application } from "@/lib/models/application"
import { Contact } from "@/lib/models/contact"

function cleanOptional<T>(v: T | null | undefined): T | undefined {
  return v == null ? undefined : v
}

function serializeContact(c: {
  _id: { toString(): string }
  name: string
  email?: string
  phone?: string
  telegram?: string
  linkedin?: string
  company?: string
  role?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: c._id.toString(),
    name: c.name,
    email: c.email ?? null,
    phone: c.phone ?? null,
    telegram: c.telegram ?? null,
    linkedin: c.linkedin ?? null,
    company: c.company ?? null,
    role: c.role ?? null,
    notes: c.notes ?? null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  await connectDb()

  const contacts = await Contact.find({ userId }).sort({ name: 1 })
  const apps = await Application.find({ userId }).select("contactIds")

  const counts = new Map<string, number>()
  for (const app of apps) {
    for (const contactId of app.contactIds ?? []) {
      counts.set(contactId, (counts.get(contactId) ?? 0) + 1)
    }
  }

  return NextResponse.json({
    contacts: contacts.map((c) => ({
      ...serializeContact(c),
      applicationCount: counts.get(c._id.toString()) ?? 0,
    })),
  })
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

  const parsed = contactCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const data = parsed.data
  await connectDb()

  const created = await Contact.create({
    userId,
    name: data.name,
    email: cleanOptional(data.email),
    phone: cleanOptional(data.phone),
    telegram: cleanOptional(data.telegram),
    linkedin: cleanOptional(data.linkedin),
    company: cleanOptional(data.company),
    role: cleanOptional(data.role),
    notes: cleanOptional(data.notes),
  })

  return NextResponse.json(
    { contact: serializeContact(created) },
    { status: 201 }
  )
}
