import { NextResponse } from "next/server"

import { connectDb } from "@/lib/db"
import { Application } from "@/lib/models/application"
import { PushSubscription } from "@/lib/models/push-subscription"
import { sendPush } from "@/lib/web-push"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const secret = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await connectDb()

  const now = new Date()
  const in1h = new Date(now.getTime() + 60 * 60 * 1000)

  const due = await Application.find({
    archived: false,
    nextEventAt: { $gte: now, $lte: in1h },
  })

  for (const app of due) {
    const subs = await PushSubscription.find({ userId: app.userId })
    for (const s of subs) {
      await sendPush(
        { endpoint: s.endpoint, keys: s.keys },
        {
          title: "Скоро собеседование",
          body: `${app.role} · ${app.company} — ${app.nextEventType ?? "событие"} в ближайший час`,
          url: `/applications/${app._id.toString()}`,
        }
      )
    }
  }

  return NextResponse.json({ sent: due.length })
}
