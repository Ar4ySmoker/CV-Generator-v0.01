import { redirect } from "next/navigation"

import { ProfilesManager } from "@/components/settings/profiles-manager"
import { auth } from "@/lib/auth"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium">Профиль</h1>
      <p className="text-sm text-muted-foreground">
        Заполните данные о себе один раз — они будут подставляться при генерации
        CV и в откликах.
      </p>
      <div className="mt-4">
        <ProfilesManager />
      </div>
    </div>
  )
}
