"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell, BellOff, BellRing, Send } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

import { usePushSubscription } from "@/components/notifications/use-push"

interface Settings {
  enabled: boolean
  interviewReminders: boolean
  reminderLeadMinutes: number
}

const LEAD_OPTIONS = [
  { value: 30, label: "За 30 минут" },
  { value: 60, label: "За 1 час" },
  { value: 180, label: "За 3 часа" },
  { value: 360, label: "За 6 часов" },
  { value: 1440, label: "За 24 часа" },
]

const DEFAULTS: Settings = {
  enabled: true,
  interviewReminders: true,
  reminderLeadMinutes: 60,
}

export function NotificationsSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const push = usePushSubscription()

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/settings")
      if (res.ok) {
        const d = (await res.json()) as { settings?: Settings }
        if (d.settings) setSettings(d.settings)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function update(patch: Partial<Settings>) {
    const prev = settings
    setSettings((s) => ({ ...s, ...patch }))
    try {
      const res = await fetch("/api/notifications/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось сохранить")
      }
      const d = (await res.json()) as { settings: Settings }
      setSettings(d.settings)
    } catch (e) {
      setSettings(prev)
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить")
    }
  }

  async function sendTest() {
    setSending(true)
    try {
      const res = await fetch("/api/push/test", { method: "POST" })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось отправить")
      }
      const d = (await res.json().catch(() => ({}))) as { sent?: number }
      if (d.sent && d.sent > 0) {
        toast.success("Тестовое уведомление отправлено")
      } else {
        toast.info(
          "Нет активных подписок. Сначала включите уведомления в браузере."
        )
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось отправить")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Напоминания</CardTitle>
          <CardDescription>
            Web-push уведомления о предстоящих событиях и собеседованиях.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <Label>Уведомления</Label>
              <p className="text-xs text-muted-foreground">
                Главный переключатель всех push-уведомлений.
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(v) => update({ enabled: v })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <Label>Напоминания о собеседованиях</Label>
              <p className="text-xs text-muted-foreground">
                Напоминать о предстоящих событиях и интервью.
              </p>
            </div>
            <Switch
              checked={settings.interviewReminders}
              disabled={!settings.enabled}
              onCheckedChange={(v) => update({ interviewReminders: v })}
            />
          </div>

          <Separator />

          <div className="flex flex-col gap-1.5">
            <Label>За сколько напоминать</Label>
            <Select
              value={String(settings.reminderLeadMinutes)}
              onValueChange={(v) =>
                update({ reminderLeadMinutes: Number(v) })
              }
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Это устройство</CardTitle>
          <CardDescription>
            Разрешение на push-уведомления для текущего браузера.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {push.status === "subscribed" ? (
              <Badge>
                <BellRing className="text-primary" />
                Включено
              </Badge>
            ) : push.status === "denied" ? (
              <Badge variant="secondary">
                <BellOff />
                Запрещено браузером
              </Badge>
            ) : push.status === "unsupported" ? (
              <Badge variant="secondary">
                <BellOff />
                Не поддерживается браузером
              </Badge>
            ) : push.status === "unconfigured" ? (
              <Badge variant="secondary">
                <BellOff />
                Web-push не настроен
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Bell />
                Выключено
              </Badge>
            )}
          </div>

          {push.status === "unconfigured" ? (
            <p className="text-sm text-muted-foreground">
              Push-уведомления отключены: не заданы VAPID-ключи
              (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
              `VAPID_SUBJECT`). Добавьте их в переменные окружения и
              передеплойте.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {push.status === "subscribed" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={push.unsubscribe}
                disabled={push.busy}
              >
                <BellOff /> Выключить в этом браузере
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={push.subscribe}
                disabled={
                  push.busy ||
                  push.status === "denied" ||
                  push.status === "unsupported" ||
                  push.status === "unconfigured"
                }
              >
                <BellRing /> Включить в этом браузере
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={sendTest}
              disabled={
                sending ||
                push.status !== "subscribed"
              }
            >
              <Send /> {sending ? "Отправляем…" : "Отправить тестовое"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
