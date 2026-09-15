"use client"

import { useCallback, useEffect, useState } from "react"

export type PushStatus =
  | "loading"
  | "unconfigured"
  | "unsupported"
  | "denied"
  | "subscribed"
  | "unsubscribed"

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

export function usePushSubscription() {
  const [status, setStatus] = useState<PushStatus>("loading")
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      setStatus("unconfigured")
      return
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported")
      return
    }
    if ("Notification" in window && Notification.permission === "denied") {
      setStatus("denied")
      return
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = reg ? await reg.pushManager.getSubscription() : null
      setStatus(sub ? "subscribed" : "unsubscribed")
    } catch {
      setStatus("unsubscribed")
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const subscribe = useCallback(async (): Promise<boolean> => {
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!key) {
      setStatus("unconfigured")
      return false
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported")
      return false
    }
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.register("/sw.js")
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "unsubscribed")
        return false
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
      setStatus("subscribed")
      return true
    } catch {
      setStatus("unsubscribed")
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = reg ? await reg.pushManager.getSubscription() : null
      if (sub) {
        await sub.unsubscribe()
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
      }
      setStatus("unsubscribed")
    } catch {
      // ignore
    } finally {
      setBusy(false)
    }
  }, [])

  return { status, busy, subscribe, unsubscribe, refresh }
}
