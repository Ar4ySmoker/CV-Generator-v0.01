import { redirect } from "next/navigation"

import { ApplicationsBoard } from "@/components/applications/applications-board"
import { auth } from "@/lib/auth"

export default async function ApplicationsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <h1 className="font-heading text-2xl font-medium">Отклики</h1>
      <ApplicationsBoard />
    </main>
  )
}
