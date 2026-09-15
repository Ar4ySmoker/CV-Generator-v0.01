import { redirect } from "next/navigation"

import { ApplicationsBoard } from "@/components/applications/applications-board"
import { auth } from "@/lib/auth"

export default async function ApplicationsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-medium">Отклики</h1>
        <p className="text-sm text-muted-foreground">
          Воронка ваших откликов — от отправки CV до офера.
        </p>
      </div>
      <ApplicationsBoard />
    </div>
  )
}
