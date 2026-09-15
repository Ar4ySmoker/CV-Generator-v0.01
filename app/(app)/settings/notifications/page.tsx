import { redirect } from "next/navigation"

import { NotificationsSettings } from "@/components/settings/notifications-settings"
import { auth } from "@/lib/auth"

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium">Уведомления</h1>
      <p className="text-sm text-muted-foreground">
        Настройте push-уведомления о предстоящих собеседованиях.
      </p>
      <div className="mt-4">
        <NotificationsSettings />
      </div>
    </div>
  )
}
