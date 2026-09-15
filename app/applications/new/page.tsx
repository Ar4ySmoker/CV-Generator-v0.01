import { redirect } from "next/navigation"

import { AppHeader } from "@/components/app/app-header"
import { ApplicationForm } from "@/components/applications/application-form"
import { auth } from "@/lib/auth"

export default async function NewApplicationPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <AppHeader />
      <h1 className="font-heading text-2xl font-medium">Новый отклик</h1>
      <ApplicationForm />
    </main>
  )
}
