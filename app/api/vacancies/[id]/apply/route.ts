import { NextResponse } from "next/server"

import { serializeApplication } from "@/lib/application-serialize"
import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Application } from "@/lib/models/application"
import { Vacancy } from "@/lib/models/vacancy"
import { VacancyStatus } from "@/lib/models/vacancy-status"
import { listStages, startStageId } from "@/lib/pipeline"

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

  const stageId = await startStageId(userId)
  const stages = await listStages(userId)
  const startStage = stages.find((s) => s._id.toString() === stageId)

  const created = await Application.create({
    userId,
    company: vacancy.company,
    role: vacancy.role,
    country: vacancy.country,
    salaryMin: vacancy.salaryMin,
    salaryMax: vacancy.salaryMax,
    currency: vacancy.currency,
    sourceType: vacancy.sourceType,
    sourceUrl: vacancy.sourceUrl,
    vacancyText: vacancy.description,
    contactIds: [],
    stageId,
    timeline: [
      {
        at: new Date(),
        type: "stage_change",
        stageName: startStage?.name ?? "Черновик",
        stageId,
      },
    ],
  })

  await VacancyStatus.updateOne(
    { userId, vacancyId: id },
    { $set: { status: "applied", applicationId: created._id.toString() } },
    { upsert: true }
  )

  return NextResponse.json(
    {
      applicationId: created._id.toString(),
      application: serializeApplication(created),
    },
    { status: 201 }
  )
}
