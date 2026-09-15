"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { ArrowRight, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"

export function SiteHeader() {
  const { status } = useSession()
  const authed = status === "authenticated"

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-heading font-medium"
        >
          <FileText className="size-5 text-primary" />
          <span className="whitespace-nowrap">CV-генератор</span>
        </Link>

        <div className="flex items-center gap-2">
          {authed ? (
            <Button asChild size="sm">
              <Link href="/dashboard">
                Открыть приложение <ArrowRight />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Войти</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Регистрация</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
