"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { Stage } from "./types"

const CHANNELS = ["Email", "Telegram", "LinkedIn", "Messenger"]

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export function SendDialog({
  stages,
  applicationId,
  onSaved,
  trigger,
}: {
  stages: Stage[]
  applicationId: string
  onSaved?: () => void
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState("")
  const [customChannel, setCustomChannel] = useState("")
  const [sendTo, setSendTo] = useState("")
  const [sendAt, setSendAt] = useState(toLocalInputValue(new Date()))
  const [saving, setSaving] = useState(false)

  async function submit() {
    const finalChannel = channel === "Другое" ? customChannel.trim() : channel
    if (!finalChannel && !sendTo.trim()) return

    const sentStage = stages.find((s) => s.name === "Отправлено")
    setSaving(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentChannel: finalChannel || null,
          sentTo: sendTo.trim() || null,
          sentAt: new Date(sendAt).toISOString(),
          ...(sentStage ? { stageId: sentStage.id } : {}),
          activity: { type: "sent" },
        }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось сохранить")
      }
      toast.success("Отправка зафиксирована")
      setOpen(false)
      onSaved?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Send /> Зафиксировать отправку
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отправка CV</DialogTitle>
          <DialogDescription>
            Зафиксируйте факт отправки — отклик перейдёт на этап «Отправлено».
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Канал</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Канал" />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                <SelectItem value="Другое">Другое…</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {channel === "Другое" ? (
            <div className="flex flex-col gap-1.5">
              <Label>Свой канал</Label>
              <Input
                value={customChannel}
                onChange={(e) => setCustomChannel(e.target.value)}
                placeholder="WhatsApp, мессенджер…"
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label>Кому</Label>
            <Input
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
              placeholder="email / @telegram / имя"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Когда</Label>
            <Input
              type="datetime-local"
              value={sendAt}
              onChange={(e) => setSendAt(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Сохраняем…" : "Зафиксировать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
