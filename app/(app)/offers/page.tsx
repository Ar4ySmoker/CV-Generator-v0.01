import { redirect } from "next/navigation"

import { OffersTable } from "@/components/offers/offers-table"
import { auth } from "@/lib/auth"

export default async function OffersPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-medium">Оферы</h1>
      <OffersTable />
    </div>
  )
}
