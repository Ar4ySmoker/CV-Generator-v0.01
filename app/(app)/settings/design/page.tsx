import { redirect } from "next/navigation"

import { ThemesManager } from "@/components/settings/themes-manager"
import { auth } from "@/lib/auth"

export default async function DesignPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium">Дизайн CV</h1>
      <p className="text-sm text-muted-foreground">
        Создавайте собственные темы оформления — так CV не будут выглядеть
        одинаково у всех пользователей платформы.
      </p>
      <div className="mt-4">
        <ThemesManager />
      </div>
    </div>
  )
}
