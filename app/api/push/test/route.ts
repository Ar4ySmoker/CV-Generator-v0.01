import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { PushSubscription } from "@/lib/models/push-subscription"
import { isWebPushConfigured, sendPush } from "@/lib/web-push"

export async function POST() {
  const userId = await getUserId()
  if (!userId) {
    return Response.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  if (!isWebPushConfigured()) {
    return Response.json(
      { error: "Web-push не настроен (нет VAPID-ключей)" },
      { status: 503 }
    )
  }

  await connectDb()
  const subs = await PushSubscription.find({ userId })

  let sent = 0
  for (const s of subs) {
    const { ok, invalid } = await sendPush(
      { endpoint: s.endpoint, keys: s.keys },
      {
        title: "Тестовое уведомление",
        body: "Web-push работает! Вы будете получать напоминания о собеседованиях.",
        url: "/dashboard",
      }
    )
    if (ok) {
      sent++
    } else if (invalid) {
      await PushSubscription.deleteOne({ _id: s._id })
    }
  }

  return Response.json({ sent, subscriptions: subs.length })
}
