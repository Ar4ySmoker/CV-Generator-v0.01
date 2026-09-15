import { NextResponse } from "next/server"

import { connectDb } from "@/lib/db"
import { Application } from "@/lib/models/application"
import { Interview } from "@/lib/models/interview"
import { PushSubscription } from "@/lib/models/push-subscription"
import { sendPush } from "@/lib/web-push"

export const runtime = "nodejs"

const INTERVIEW_LABELS: Record<string, string> = {
  screen: "Собеседование",
  technical: "Тех. собеседование",
  final: "Финальное интервью",
  assignment: "Тестовое задание",
  custom: "Событие",
}

export async function GET(request: Request) {
  const secret = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await connectDb()

  const now = new Date()
  const in1h = new Date(now.getTime() + 60 * 60 * 1000)

  const due = await Interview.find({
    status: "scheduled",
    scheduledAt: { $gte: now, $lte: in1h },
  })

  for (const interview of due) {
    const app = await Application.findById(interview.applicationId)
    const subs = await PushSubscription.find({ userId: interview.userId })
    for (const s of subs) {
      await sendPush(
        { endpoint: s.endpoint, keys: s.keys },
        {
          title: "Скоро собеседование",
          body: `${app?.role ?? ""} · ${app?.company ?? ""} — ${INTERVIEW_LABELS[interview.type] ?? "событие"} в ближайший час`,
          url: `/applications/${interview.applicationId}`,
        }
      )
    }
  }

  return NextResponse.json({ sent: due.length })
}
