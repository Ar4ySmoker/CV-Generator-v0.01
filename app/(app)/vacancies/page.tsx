import { redirect } from "next/navigation"

import { VacanciesBoard } from "@/components/vacancies/vacancies-board"
import { auth } from "@/lib/auth"

export default async function VacanciesPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-medium">Вакансии</h1>
        <p className="text-sm text-muted-foreground">
          Каталог вакансий — сохраняйте, подавайтесь и делитесь с командой.
        </p>
      </div>
      <VacanciesBoard />
    </div>
  )
}
