import { redirect } from "next/navigation"

import { OffersTable } from "@/components/offers/offers-table"
import { auth } from "@/lib/auth"

export default async function OffersPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <h1 className="font-heading text-2xl font-medium">Оферы</h1>
      <OffersTable />
    </main>
  )
}
