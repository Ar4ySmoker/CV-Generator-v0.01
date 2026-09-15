import { NextResponse } from "next/server"
import { z } from "zod"

import { applyToVacancy } from "@/lib/vacancy-apply"
import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Vacancy } from "@/lib/models/vacancy"
import { serializeVacancy } from "@/lib/vacancy-serialize"

const importSchema = z.object({
  company: z.string().trim().min(1, "Укажите компанию").max(120),
  role: z.string().trim().min(1, "Укажите должность").max(120),
  country: z.string().trim().optional(),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  currency: z.string().trim().optional(),
  sourceUrl: z.string().trim().optional(),
  sourceType: z.string().trim().optional(),
  description: z.string().trim().optional(),
  tags: z.array(z.string().trim().max(30)).max(10).optional(),
  apply: z.boolean().optional(),
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

  const data = parsed.data
  await connectDb()

  const vacancy = await Vacancy.create({
    company: data.company,
    role: data.role,
    country: data.country,
    salaryMin: data.salaryMin ?? undefined,
    salaryMax: data.salaryMax ?? undefined,
    currency: data.currency,
    sourceUrl: data.sourceUrl,
    sourceType: data.sourceType,
    description: data.description,
    tags: data.tags ?? [],
    source: "manual",
    createdById: userId,
  })

  let applicationId: string | undefined
  if (data.apply) {
    applicationId = await applyToVacancy(userId, vacancy)
  }

  return NextResponse.json(
    {
      vacancy: serializeVacancy(vacancy),
      applicationId: applicationId ?? null,
    },
    { status: 201 }
  )
}
