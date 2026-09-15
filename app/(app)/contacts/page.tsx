import { redirect } from "next/navigation"

import { ContactsManager } from "@/components/contacts/contacts-manager"
import { auth } from "@/lib/auth"

export default async function ContactsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-medium">Контакты</h1>
        <p className="text-sm text-muted-foreground">
          Адресная книга рекрутеров и нанимающих менеджеров.
        </p>
      </div>
      <ContactsManager />
    </div>
  )
}
