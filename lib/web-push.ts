import webpush from "web-push"

export function isWebPushConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PRIVATE_KEY &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_SUBJECT
  )
}

function ensureConfigured(): void {
  if (!isWebPushConfigured()) {
    return
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
}

export async function sendPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: Record<string, unknown>
): Promise<void> {
  if (!isWebPushConfigured()) {
    return
  }
  ensureConfigured()
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
  } catch {
    // подписка может быть невалидной — игнорируем (удалится при следующей синхронизации)
  }
}
