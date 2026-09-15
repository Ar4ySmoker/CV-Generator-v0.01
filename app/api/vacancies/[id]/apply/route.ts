import { NextResponse } from "next/server"

import { serializeApplication } from "@/lib/application-serialize"
import { applyToVacancy } from "@/lib/vacancy-apply"
import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Application } from "@/lib/models/application"
import { Vacancy } from "@/lib/models/vacancy"
import { VacancyStatus } from "@/lib/models/vacancy-status"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id } = await params
  await connectDb()

  const vacancy = await Vacancy.findById(id)
  if (!vacancy) {
    return NextResponse.json({ error: "Вакансия не найдена" }, { status: 404 })
  }

  const existing = await VacancyStatus.findOne({ userId, vacancyId: id })
  if (existing?.status === "applied" && existing.applicationId) {
    return NextResponse.json({ applicationId: existing.applicationId })
  }

  const applicationId = await applyToVacancy(userId, vacancy)

  const application = await Application.findById(applicationId)
  return NextResponse.json(
    {
      applicationId,
      application: application ? serializeApplication(application) : null,
    },
    { status: 201 }
  )
}
