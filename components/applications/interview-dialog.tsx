"use client"

import { useState } from "react"
import { CalendarClock } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"

import { INTERVIEW_LABELS, type InterviewType } from "./types"

const TYPES: InterviewType[] = ["screen", "technical", "final", "assignment", "custom"]

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export function InterviewDialog({
  applicationId,
  onCreated,
  trigger,
}: {
  applicationId: string
  onCreated?: () => void
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<InterviewType>("screen")
  const [scheduledAt, setScheduledAt] = useState(
    toLocalInputValue(new Date(Date.now() + 24 * 3600 * 1000))
  )
  const [channel, setChannel] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          type,
          scheduledAt: new Date(scheduledAt).toISOString(),
          channel: channel.trim() || null,
          note: note.trim() || null,
        }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось сохранить")
      }
      toast.success("Событие назначено")
      setOpen(false)
      setChannel("")
      setNote("")
      onCreated?.()
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
          <Button variant="outline" size="sm">
            <CalendarClock /> Назначить событие
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новое событие</DialogTitle>
          <DialogDescription>
            Созвон, собеседование или тестовое — напомним вовремя.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Тип</Label>
            <Select value={type} onValueChange={(v) => setType(v as InterviewType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {INTERVIEW_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Когда</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Канал / ссылка</Label>
            <Input
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="Google Meet / Zoom / телефон…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Заметка</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Что подготовить, с кем встреча…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={submit} disabled={saving || !scheduledAt}>
            {saving ? "Сохраняем…" : "Назначить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
