"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import type { FeedbackKind, Outcome } from "./types"

export const OUTCOMES: Record<Outcome, { label: string; color: string }> = {
  "in-progress": { label: "В процессе", color: "#94a3b8" },
  offer: { label: "Офер", color: "#22c55e" },
  accepted: { label: "Принято", color: "#16a34a" },
  rejected: { label: "Отклонено", color: "#ef4444" },
  "no-response": { label: "Нет ответа", color: "#9ca3af" },
}

export const KIND_LABELS: Record<FeedbackKind, string> = {
  questions: "Вопросы на собеседовании",
  tips: "Советы по подготовке",
  general: "Общее",
}

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  const meta = OUTCOMES[outcome]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  )
}

export function FeedbackForm({
  teamId,
  companyKey,
  company,
  onAdded,
}: {
  teamId: string
  companyKey: string
  company: string
  onAdded: () => void
}) {
  const [kind, setKind] = useState<FeedbackKind>("questions")
  const [rating, setRating] = useState("")
  const [text, setText] = useState("")
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!text.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyKey,
          company,
          kind,
          rating: rating ? Number(rating) : undefined,
          text: text.trim(),
        }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось сохранить")
      }
      setText("")
      setRating("")
      toast.success("Отзыв добавлен")
      onAdded()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-3">
      <div className="flex flex-wrap gap-2">
        <Select value={kind} onValueChange={(v) => setKind(v as FeedbackKind)}>
          <SelectTrigger size="sm" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(KIND_LABELS) as FeedbackKind[]).map((k) => (
              <SelectItem key={k} value={k}>
                {KIND_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={rating} onValueChange={setRating}>
          <SelectTrigger size="sm" className="w-32">
            <SelectValue placeholder="Сложность" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} / 5
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Что спрашивали, к чему готовиться, подводные камни…"
        className="min-h-16"
      />
      <Button
        size="sm"
        className="w-fit"
        onClick={submit}
        disabled={saving || !text.trim()}
      >
        <Send /> {saving ? "Сохраняем…" : "Добавить отзыв"}
      </Button>
    </div>
  )
}
