import { redirect } from "next/navigation"

import { TelegramFeed } from "@/components/telegram/telegram-feed"
import { auth } from "@/lib/auth"

export default async function TelegramPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-medium">Telegram</h1>
        <p className="text-sm text-muted-foreground">
          Лента вакансий из Telegram-каналов.
        </p>
      </div>
      <TelegramFeed />
    </div>
  )
}
