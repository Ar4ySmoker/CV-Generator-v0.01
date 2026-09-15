import { NextResponse } from "next/server"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Application } from "@/lib/models/application"
import { PipelineStage } from "@/lib/models/pipeline-stage"
import { Team } from "@/lib/models/team"
import { User } from "@/lib/models/user"
import { VacancyFeedback } from "@/lib/models/vacancy-feedback"
import { activeMemberIds, isTeamMember, normalizeCompany } from "@/lib/team"

type Outcome = "in-progress" | "offer" | "accepted" | "rejected" | "no-response"

function outcomeOf(stage: PipelineStageDocLike | undefined): Outcome {
  if (!stage) return "in-progress"
  if (stage.type === "terminal") {
    if (stage.terminalResult === "accepted") return "accepted"
    if (stage.terminalResult === "rejected") return "rejected"
    if (stage.terminalResult === "no-response") return "no-response"
    return "in-progress"
  }
  if (stage.name === "Офер") return "offer"
  return "in-progress"
}

type PipelineStageDocLike = {
  name: string
  type: string
  terminalResult?: string | null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id } = await params
  await connectDb()

  const team = await Team.findById(id)
  if (!team || !(await isTeamMember(userId, id))) {
    return NextResponse.json({ error: "Команда не найдена" }, { status: 404 })
  }

  const members = await activeMemberIds(id)

  const [apps, stages, feedbacks, users] = await Promise.all([
    Application.find({
      userId: { $in: members },
      visibility: "team",
      archived: { $ne: true },
    }),
    PipelineStage.find({ userId: { $in: members } }),
    VacancyFeedback.find({ teamId: id }).sort({ createdAt: 1 }),
    User.find({ _id: { $in: members } }),
  ])

  const stageMap = new Map(stages.map((s) => [s._id.toString(), s]))
  const userMap = new Map(users.map((u) => [u._id.toString(), u]))

  const byCompany = new Map<
    string,
    { company: string; apps: typeof apps }
  >()
  for (const a of apps) {
    const key = normalizeCompany(a.company)
    const entry = byCompany.get(key)
    if (entry) {
      entry.apps.push(a)
    } else {
      byCompany.set(key, { company: a.company, apps: [a] })
    }
  }

  const feedbackByKey = new Map<string, typeof feedbacks>()
  for (const f of feedbacks) {
    const list = feedbackByKey.get(f.companyKey) ?? []
    list.push(f)
    feedbackByKey.set(f.companyKey, list)
  }

  const vacancies = []
  for (const [key, entry] of byCompany) {
    const applicants = entry.apps.map((a) => {
      const stage = stageMap.get(a.stageId)
      const u = userMap.get(a.userId)
      return {
        applicationId: a._id.toString(),
        memberId: a.userId,
        memberName: u?.name || u?.email || "Участник",
        role: a.role,
        stage: stage?.name ?? "—",
        outcome: outcomeOf(stage),
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

    const feedback = (feedbackByKey.get(key) ?? []).map((f) => {
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

    vacancies.push({
      companyKey: key,
      company: entry.company,
      applicants,
      feedback,
    })
  }

  vacancies.sort((x, y) => {
    const mx = Math.max(
      0,
      ...x.applicants.map((a: { updatedAt: Date }) => new Date(a.updatedAt).getTime())
    )
    const my = Math.max(
      0,
      ...y.applicants.map((a: { updatedAt: Date }) => new Date(a.updatedAt).getTime())
    )
    return my - mx
  })

  return NextResponse.json({ teamId: id, vacancies })
}
