import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { ApiKeysManager } from "@/components/settings/api-keys-manager"

export default async function KeysPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium">API-ключи</h1>
      <p className="text-sm text-muted-foreground">
        Подключите свои ключи DeepSeek, OpenAI, OpenRouter или любой
        OpenAI-совместимый endpoint.
      </p>
      <div className="mt-4">
        <ApiKeysManager />
      </div>
    </div>
  )
}
