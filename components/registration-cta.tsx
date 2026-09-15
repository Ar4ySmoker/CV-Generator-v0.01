"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"

export function RegistrationCta() {
  const { status } = useSession()
  if (status === "authenticated") {
    return null
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-muted/30 px-6 py-4 text-center">
      <p className="text-sm text-muted-foreground">
        Без регистрации данные не сохраняются. Создайте аккаунт, чтобы хранить
        профиль, переиспользовать его и трекать отклики до офера.
      </p>
      <Button asChild size="sm">
        <Link href="/register">Зарегистрироваться</Link>
      </Button>
    </div>
  )
}
