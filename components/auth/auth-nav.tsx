"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"

export function AuthNav() {
  const { status } = useSession()

  if (status === "authenticated") {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard">Личный кабинет</Link>
      </Button>
    )
  }

  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/login">Войти</Link>
    </Button>
  )
}
