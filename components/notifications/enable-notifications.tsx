"use client"

import { Bell, BellRing } from "lucide-react"

import { Button } from "@/components/ui/button"

import { usePushSubscription } from "./use-push"

export function EnableNotifications() {
  const { status, busy, subscribe, unsubscribe } = usePushSubscription()

  if (
    status === "loading" ||
    status === "unsupported" ||
    status === "unconfigured" ||
    status === "denied"
  ) {
    return null
  }

  if (status === "subscribed") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={unsubscribe}
        disabled={busy}
        title="Выключить уведомления"
      >
        <BellRing className="text-primary" />
        Уведомления включены
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-fit"
      onClick={subscribe}
      disabled={busy}
    >
      <Bell />
      {busy ? "Включаем…" : "Включить уведомления"}
    </Button>
  )
}
