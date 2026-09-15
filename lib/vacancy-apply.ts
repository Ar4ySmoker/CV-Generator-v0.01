import { Application } from "./models/application"
import type { VacancyDoc } from "./models/vacancy"
import { VacancyStatus } from "./models/vacancy-status"
import { listStages, startStageId } from "./pipeline"

export async function applyToVacancy(
  userId: string,
  vacancy: VacancyDoc
): Promise<string> {
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
    { userId, vacancyId: vacancy._id.toString() },
    { $set: { status: "applied", applicationId: created._id.toString() } },
    { upsert: true }
  )

  return created._id.toString()
}
