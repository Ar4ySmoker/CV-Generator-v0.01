import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NotificationSettings,
} from "@/lib/models/notification-settings"

const settingsSchema = z
  .object({
    enabled: z.boolean().optional(),
    interviewReminders: z.boolean().optional(),
    reminderLeadMinutes: z.number().int().min(5).max(10080).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "Нет полей для обновления",
  })

function serialize(s: {
  enabled: boolean
  interviewReminders: boolean
  reminderLeadMinutes: number
}) {
  return {
    enabled: s.enabled,
    interviewReminders: s.interviewReminders,
    reminderLeadMinutes: s.reminderLeadMinutes,
  }
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return Response.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  await connectDb()
  const doc = await NotificationSettings.findOne({ userId })

  return Response.json({
    settings: doc ? serialize(doc) : { ...DEFAULT_NOTIFICATION_SETTINGS },
  })
}

export async function PATCH(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return Response.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Некорректное тело запроса" }, { status: 400 })
  }

  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  await connectDb()

  const doc = await NotificationSettings.findOneAndUpdate(
    { userId },
    { $set: parsed.data },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  return Response.json({ settings: serialize(doc) })
}
