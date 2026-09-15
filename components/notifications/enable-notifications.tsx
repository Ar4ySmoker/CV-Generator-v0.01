"use client"

import { useState } from "react"
import { Bell, BellRing } from "lucide-react"

import { Button } from "@/components/ui/button"

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

export function EnableNotifications() {
  const [enabled, setEnabled] = useState(false)
  const [unsupported, setUnsupported] = useState(false)
  const [busy, setBusy] = useState(false)

  async function enable() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setUnsupported(true)
      return
    }
    setBusy(true)
    try {
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!key) {
        setUnsupported(true)
        return
      }
      const reg = await navigator.serviceWorker.register("/sw.js")
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        return
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      })
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      })
      setEnabled(true)
    } catch {
      setUnsupported(true)
    } finally {
      setBusy(false)
    }
  }

  if (unsupported) {
    return (
      <p className="text-xs text-muted-foreground">
        Уведомления не поддерживаются в этом браузере.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {enabled ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <BellRing className="size-4 text-primary" />
          Уведомления о собеседованиях включены
        </p>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={enable}
          disabled={busy}
        >
          <Bell /> {busy ? "Включаем…" : "Включить уведомления"}
        </Button>
      )}
    </div>
  )
}
