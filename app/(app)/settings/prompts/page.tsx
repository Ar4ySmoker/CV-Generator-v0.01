import { redirect } from "next/navigation"

import { PromptsManager } from "@/components/settings/prompts-manager"
import { auth } from "@/lib/auth"

export default async function PromptsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium">Промты</h1>
      <p className="text-sm text-muted-foreground">
        Управляйте собственными промтами: скопируйте референсный промт в ChatGPT,
        отредактируйте и вставьте обратно — CV будет генерироваться по вашим
        правилам.
      </p>
      <div className="mt-4">
        <PromptsManager />
      </div>
    </div>
  )
}
