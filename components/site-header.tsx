"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const APP_LINKS = [
  { href: "/dashboard", label: "Дашборд" },
  { href: "/applications", label: "Отклики" },
  { href: "/offers", label: "Оферы" },
  { href: "/settings/profile", label: "Профиль" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const authed = status === "authenticated"

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-heading font-medium"
        >
          <FileText className="size-5 text-primary" />
          <span>CV-генератор</span>
        </Link>

        {authed ? (
          <div className="flex items-center gap-1 overflow-x-auto">
            <nav className="flex gap-1">
              {APP_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                    pathname.startsWith(l.href)
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <span className="ml-2 hidden text-xs text-muted-foreground lg:inline">
              {session?.user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Выйти
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Войти</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Регистрация</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
