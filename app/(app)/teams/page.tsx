import { Suspense } from "react"
import { redirect } from "next/navigation"

import { TeamsManager } from "@/components/teams/teams-manager"
import { Skeleton } from "@/components/ui/skeleton"
import { auth } from "@/lib/auth"

export default async function TeamsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-medium">Команда</h1>
        <p className="text-sm text-muted-foreground">
          Делитесь вакансиями и опытом собеседований с друзьями.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <TeamsManager />
      </Suspense>
    </div>
  )
}
