"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/settings/keys", label: "API-ключи" },
  { href: "/settings/profile", label: "Профили" },
  { href: "/settings/prompts", label: "Промты" },
  { href: "/settings/design", label: "Дизайн" },
  { href: "/settings/pipeline", label: "Воронка" },
  { href: "/settings/notifications", label: "Уведомления" },
]

export function SettingsNav() {
  const pathname = usePathname()
  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border border-border/60 p-1">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm transition-colors",
            pathname === l.href
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
