import { redirect } from "next/navigation"

import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { auth } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <h1 className="font-heading text-2xl font-medium">Дашборд</h1>
      <DashboardStats />
    </main>
  )
}
