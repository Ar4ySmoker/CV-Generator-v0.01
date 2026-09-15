import { redirect } from "next/navigation"

import { CompanyDetail } from "@/components/teams/company-detail"
import { auth } from "@/lib/auth"

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string; companyKey: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const { id, companyKey } = await params

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <CompanyDetail teamId={id} companyKey={companyKey} />
    </div>
  )
}
