"use client"

import { useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase()
}

export function CompanyLogo({
  domain,
  name,
  size = "sm",
  className,
}: {
  domain?: string | null
  name: string
  size?: "sm" | "lg"
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const src =
    domain && !failed
      ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
      : undefined

  return (
    <Avatar size={size} className={cn("rounded-lg", className)}>
      {src ? (
        <AvatarImage src={src} alt="" onError={() => setFailed(true)} />
      ) : null}
      <AvatarFallback className="rounded-lg bg-muted text-xs">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
