import { redirect } from "next/navigation"

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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <ApplicationDetail applicationId={id} />
    </div>
  )
}
