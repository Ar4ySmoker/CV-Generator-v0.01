import { Suspense } from "react"
import { redirect } from "next/navigation"

import { TeamDetail } from "@/components/teams/team-detail"
import { Skeleton } from "@/components/ui/skeleton"
import { auth } from "@/lib/auth"

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const { id } = await params

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <TeamDetail teamId={id} />
      </Suspense>
    </div>
  )
}
