import { NextResponse } from "next/server"

import { connectDb } from "@/lib/db"
import { Application } from "@/lib/models/application"
import { Interview } from "@/lib/models/interview"
import { NotificationSettings } from "@/lib/models/notification-settings"
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

  const due = await Interview.find({
    status: "scheduled",
    scheduledAt: { $gte: now },
    reminderSentAt: { $exists: false },
  })

  let sent = 0
  for (const interview of due) {
    const settings = await NotificationSettings.findOne({
      userId: interview.userId,
    })

    if (settings && settings.enabled === false) continue
    if (settings && settings.interviewReminders === false) continue

    const leadMinutes = settings?.reminderLeadMinutes ?? 60
    const deadline = new Date(now.getTime() + leadMinutes * 60 * 1000)
    if (new Date(interview.scheduledAt).getTime() > deadline.getTime()) continue

    const app = await Application.findById(interview.applicationId)
    const subs = await PushSubscription.find({ userId: interview.userId })

    for (const s of subs) {
      const { invalid } = await sendPush(
        { endpoint: s.endpoint, keys: s.keys },
        {
          title: "Напоминание о собеседовании",
          body: `${app?.role ?? ""} · ${app?.company ?? ""} — ${INTERVIEW_LABELS[interview.type] ?? "событие"} скоро`,
          url: `/applications/${interview.applicationId}`,
        }
      )
      if (invalid) {
        await PushSubscription.deleteOne({ _id: s._id })
      }
    }

    interview.reminderSentAt = new Date()
    await interview.save()
    sent++
  }

  return NextResponse.json({ sent })
}
