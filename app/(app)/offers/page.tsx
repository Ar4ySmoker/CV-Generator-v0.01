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
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-medium">Оферы</h1>
        <p className="text-sm text-muted-foreground">
          Сравнение предложений по зарплате и условиям.
        </p>
      </div>
      <OffersTable />
    </div>
  )
}
