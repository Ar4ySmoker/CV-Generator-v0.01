"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"
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

const CHANNELS = ["Email", "Telegram", "LinkedIn", "Звонок", "Мессенджер"]

export function ResponseDialog({
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
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  async function submit() {
    const respStage = stages.find((s) => s.name === "Ответ (HR)")
    const parts = [channel, note.trim()].filter(Boolean)
    setSaving(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(respStage ? { stageId: respStage.id } : {}),
          activity: { type: "response", note: parts.join(" · ") || undefined },
        }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось сохранить")
      }
      toast.success("Ответ записан")
      setOpen(false)
      setNote("")
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
          <Button variant="outline" size="sm">
            <MessageSquare /> Записать ответ
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ответ от работодателя</DialogTitle>
          <DialogDescription>
            Зафиксируйте ответ — отклик перейдёт на этап «Ответ (HR)».
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Откуда</Label>
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
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Что ответили</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Пригласили на созвон, просят тестовое…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Сохраняем…" : "Записать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
