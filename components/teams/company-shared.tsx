"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Pencil, Send, Trash } from "lucide-react"
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

import type { FeedbackKind, Outcome, VacancyFeedback } from "./types"

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
  feedbackId,
  initial,
  onSaved,
  onCancel,
}: {
  teamId: string
  companyKey: string
  company: string
  feedbackId?: string
  initial?: { kind: FeedbackKind; rating: string; text: string }
  onSaved: () => void
  onCancel?: () => void
}) {
  const [kind, setKind] = useState<FeedbackKind>(initial?.kind ?? "questions")
  const [rating, setRating] = useState(initial?.rating ?? "")
  const [text, setText] = useState(initial?.text ?? "")
  const [saving, setSaving] = useState(false)

  const isEdit = Boolean(feedbackId)

  async function submit() {
    if (!text.trim()) return
    setSaving(true)
    try {
      const res = await fetch(
        isEdit
          ? `/api/teams/${teamId}/feedback/${feedbackId}`
          : `/api/teams/${teamId}/feedback`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEdit
              ? {
                  kind,
                  rating: rating ? Number(rating) : null,
                  text: text.trim(),
                }
              : {
                  companyKey,
                  company,
                  kind,
                  rating: rating ? Number(rating) : undefined,
                  text: text.trim(),
                }
          ),
        }
      )
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось сохранить")
      }
      if (!isEdit) {
        setText("")
        setRating("")
      }
      toast.success(isEdit ? "Отзыв обновлён" : "Отзыв добавлен")
      onSaved()
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
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="w-fit"
          onClick={submit}
          disabled={saving || !text.trim()}
        >
          <Send /> {saving ? "Сохраняем…" : isEdit ? "Сохранить" : "Добавить отзыв"}
        </Button>
        {onCancel ? (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Отмена
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function FeedbackList({
  teamId,
  companyKey,
  company,
  feedback,
  onChanged,
}: {
  teamId: string
  companyKey: string
  company: string
  feedback: VacancyFeedback[]
  onChanged: () => void
}) {
  const { data: session } = useSession()
  const myId = session?.user?.id ?? ""
  const [editingId, setEditingId] = useState<string | null>(null)

  async function remove(feedbackId: string) {
    const res = await fetch(`/api/teams/${teamId}/feedback/${feedbackId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      toast.success("Отзыв удалён")
      onChanged()
    } else {
      toast.error("Не удалось удалить")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {feedback.map((f) => {
        if (f.id === editingId) {
          return (
            <FeedbackForm
              key={f.id}
              teamId={teamId}
              companyKey={companyKey}
              company={company}
              feedbackId={f.id}
              initial={{
                kind: f.kind,
                rating: f.rating ? String(f.rating) : "",
                text: f.text,
              }}
              onSaved={() => {
                setEditingId(null)
                onChanged()
              }}
              onCancel={() => setEditingId(null)}
            />
          )
        }
        return (
          <div key={f.id} className="flex flex-col gap-1 rounded-lg bg-muted/30 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium">{KIND_LABELS[f.kind]}</span>
              {f.rating ? (
                <span className="text-xs text-muted-foreground">
                  Сложность {f.rating}/5
                </span>
              ) : null}
              <span className="ml-auto text-xs text-muted-foreground">
                {f.authorName}
              </span>
              {f.authorId === myId ? (
                <span className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditingId(f.id)}
                    title="Редактировать"
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-destructive"
                    onClick={() => remove(f.id)}
                    title="Удалить"
                  >
                    <Trash />
                  </Button>
                </span>
              ) : null}
            </div>
            <p className="text-sm whitespace-pre-wrap">{f.text}</p>
          </div>
        )
      })}
    </div>
  )
}
