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
): Promise<{ ok: boolean; invalid?: boolean }> {
  if (!isWebPushConfigured()) {
    return { ok: false }
  }
  ensureConfigured()
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return { ok: true }
  } catch (err) {
    const status = (err as { statusCode?: number } | null)?.statusCode
    return { ok: false, invalid: status === 404 || status === 410 }
  }
}
