import { redirect } from "next/navigation"

import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { EnableNotifications } from "@/components/notifications/enable-notifications"
import { auth } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-medium">Дашборд</h1>
        <EnableNotifications />
      </div>
      <DashboardStats />
    </div>
  )
}
