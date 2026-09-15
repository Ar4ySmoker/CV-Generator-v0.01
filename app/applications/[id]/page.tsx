import { redirect } from "next/navigation"

import { AppHeader } from "@/components/app/app-header"
import { ApplicationDetail } from "@/components/applications/application-detail"
import { auth } from "@/lib/auth"

export default async function ApplicationDetailPage({
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
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <AppHeader />
      <ApplicationDetail applicationId={id} />
    </main>
  )
}
