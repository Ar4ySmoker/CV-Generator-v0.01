"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/dashboard", label: "Дашборд" },
  { href: "/applications", label: "Отклики" },
  { href: "/offers", label: "Оферы" },
  { href: "/settings/keys", label: "Настройки" },
]

export function AppHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <nav className="flex gap-1 rounded-xl border border-border/60 p-1">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              pathname.startsWith(l.href)
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        {session?.user?.email ? (
          <span className="text-xs text-muted-foreground">
            {session.user.email}
          </span>
        ) : null}
        <SignOutButton />
      </div>
    </header>
  )
}
