import { NextResponse } from "next/server"

import { contactUpdateSchema } from "@/lib/api-schemas"
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

  const parsed = contactUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const data = parsed.data
  await connectDb()

  const contact = await Contact.findOne({ _id: id, userId })
  if (!contact) {
    return NextResponse.json({ error: "Контакт не найден" }, { status: 404 })
  }

  if (data.name !== undefined) contact.name = data.name
  if (data.email !== undefined) contact.email = cleanOptional(data.email)
  if (data.phone !== undefined) contact.phone = cleanOptional(data.phone)
  if (data.telegram !== undefined) contact.telegram = cleanOptional(data.telegram)
  if (data.linkedin !== undefined) contact.linkedin = cleanOptional(data.linkedin)
  if (data.company !== undefined) contact.company = cleanOptional(data.company)
  if (data.role !== undefined) contact.role = cleanOptional(data.role)
  if (data.notes !== undefined) contact.notes = cleanOptional(data.notes)

  await contact.save()

  return NextResponse.json({ contact: serializeContact(contact) })
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

  const contact = await Contact.findOne({ _id: id, userId })
  if (!contact) {
    return NextResponse.json({ error: "Контакт не найден" }, { status: 404 })
  }

  await contact.deleteOne()

  await Application.updateMany(
    { userId, contactIds: id },
    { $pull: { contactIds: id } }
  )

  return NextResponse.json({ ok: true })
}
