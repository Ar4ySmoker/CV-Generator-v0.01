import { NextResponse } from "next/server"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Application } from "@/lib/models/application"
import { PipelineStage } from "@/lib/models/pipeline-stage"
import { User } from "@/lib/models/user"
import { VacancyFeedback } from "@/lib/models/vacancy-feedback"
import { stageOutcome } from "@/lib/stage-outcome"
import { activeMemberIds, isTeamMember, normalizeCompany } from "@/lib/team"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; companyKey: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id, companyKey } = await params
  await connectDb()

  if (!(await isTeamMember(userId, id))) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 })
  }

  const key = normalizeCompany(companyKey)
  const members = await activeMemberIds(id)

  const [apps, stages, feedbacks, users] = await Promise.all([
    Application.find({
      userId: { $in: members },
      visibility: "team",
      archived: { $ne: true },
    }),
    PipelineStage.find({ userId: { $in: members } }),
    VacancyFeedback.find({ teamId: id, companyKey: key }).sort({ createdAt: 1 }),
    User.find({ _id: { $in: members } }),
  ])

  const stageMap = new Map(stages.map((s) => [s._id.toString(), s]))
  const userMap = new Map(users.map((u) => [u._id.toString(), u]))

  const companyApps = apps.filter((a) => normalizeCompany(a.company) === key)
  if (companyApps.length === 0) {
    return NextResponse.json({ error: "Вакансия не найдена" }, { status: 404 })
  }

  const applicants = companyApps.map((a) => {
    const stage = stageMap.get(a.stageId)
    const u = userMap.get(a.userId)
    return {
      applicationId: a._id.toString(),
      memberId: a.userId,
      memberName: u?.name || u?.email || "Участник",
      memberEmail: u?.email ?? null,
      role: a.role,
      stage: stage?.name ?? "—",
      outcome: stageOutcome(stage),
      timeline: (a.timeline ?? []).map((t) => ({
        at: t.at,
        type: t.type,
        stageName: t.stageName ?? null,
        note: t.note ?? null,
      })),
      salary: a.shareSalary
        ? {
            min: a.salaryMin ?? null,
            max: a.salaryMax ?? null,
            currency: a.currency ?? null,
          }
        : null,
      offer:
        a.shareSalary && a.offerSalary != null
          ? { salary: a.offerSalary, currency: a.offerCurrency ?? null }
          : null,
      notes: a.shareNotes ? (a.notes ?? null) : null,
      updatedAt: a.updatedAt,
    }
  })

  const feedback = feedbacks.map((f) => {
    const u = userMap.get(f.authorId)
    return {
      id: f._id.toString(),
      authorId: f.authorId,
      authorName: u?.name || u?.email || "Участник",
      kind: f.kind,
      rating: f.rating ?? null,
      text: f.text,
      createdAt: f.createdAt,
    }
  })

  const withVacancy = companyApps.find((a) => a.vacancyText || a.sourceUrl)
  const vacancy = withVacancy
    ? {
        sourceType: withVacancy.sourceType ?? null,
        sourceUrl: withVacancy.sourceUrl ?? null,
        vacancyText: withVacancy.vacancyText ?? null,
      }
    : null

  return NextResponse.json({
    company: companyApps[0]?.company ?? key,
    companyKey: key,
    vacancy,
    applicants,
    feedback,
  })
}
