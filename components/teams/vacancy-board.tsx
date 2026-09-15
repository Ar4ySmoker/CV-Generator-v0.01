"use client"

import { useCallback, useEffect, useState } from "react"
import { Building2, MessageSquare, Send } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

import { salaryRange } from "@/lib/format"

import type { FeedbackKind, Outcome, Vacancy } from "./types"

const OUTCOMES: Record<Outcome, { label: string; color: string }> = {
  "in-progress": { label: "В процессе", color: "#94a3b8" },
  offer: { label: "Офер", color: "#22c55e" },
  accepted: { label: "Принято", color: "#16a34a" },
  rejected: { label: "Отклонено", color: "#ef4444" },
  "no-response": { label: "Нет ответа", color: "#9ca3af" },
}

const KIND_LABELS: Record<FeedbackKind, string> = {
  questions: "Вопросы на собеседовании",
  tips: "Советы по подготовке",
  general: "Общее",
}

function OutcomeBadge({ outcome }: { outcome: Outcome }) {
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

function FeedbackForm({
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
        <Select
          value={kind}
          onValueChange={(v) => setKind(v as FeedbackKind)}
        >
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

function VacancyCard({
  vacancy,
  teamId,
  onChanged,
}: {
  vacancy: Vacancy
  teamId: string
  onChanged: () => void
}) {
  const [showForm, setShowForm] = useState(false)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <Building2 className="size-5 text-primary" />
        <div className="min-w-0">
          <CardTitle className="text-base">{vacancy.company}</CardTitle>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {vacancy.applicants.length} отклик(ов)
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          {vacancy.applicants.map((a) => {
            const salary = a.salary
              ? salaryRange(a.salary.min, a.salary.max, a.salary.currency)
              : ""
            const offer = a.offer
              ? `Офер: ${a.offer.salary} ${a.offer.currency ?? ""}`
              : ""
            return (
              <div
                key={a.applicationId}
                className="flex flex-col gap-1 rounded-lg border border-border/60 px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{a.memberName}</span>
                  {a.role ? (
                    <span className="text-xs text-muted-foreground">
                      {a.role}
                    </span>
                  ) : null}
                  <span className="ml-auto flex flex-wrap items-center gap-1.5">
                    <OutcomeBadge outcome={a.outcome} />
                    <span className="text-xs text-muted-foreground">
                      {a.stage}
                    </span>
                  </span>
                </div>
                {salary || offer || a.notes ? (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {salary ? <span>{salary}</span> : null}
                    {offer ? <span className="text-primary">{offer}</span> : null}
                    {a.notes ? <span>{a.notes}</span> : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        {vacancy.feedback.length > 0 ? (
          <div className="flex flex-col gap-2">
            {vacancy.feedback.map((f) => (
              <div
                key={f.id}
                className="flex flex-col gap-1 rounded-lg bg-muted/30 px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium">
                    {KIND_LABELS[f.kind]}
                  </span>
                  {f.rating ? (
                    <span className="text-xs text-muted-foreground">
                      Сложность {f.rating}/5
                    </span>
                  ) : null}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {f.authorName}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{f.text}</p>
              </div>
            ))}
          </div>
        ) : null}

        {showForm ? (
          <FeedbackForm
            teamId={teamId}
            companyKey={vacancy.companyKey}
            company={vacancy.company}
            onAdded={onChanged}
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() => setShowForm(true)}
          >
            <MessageSquare /> Оставить отзыв
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function VacancyBoard({ teamId }: { teamId: string }) {
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch(`/api/teams/${teamId}/vacancies`)
    if (res.ok) {
      const d = (await res.json()) as { vacancies: Vacancy[] }
      setVacancies(d.vacancies)
    }
    setLoading(false)
  }, [teamId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (vacancies.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 py-12 text-center">
        <Building2 className="size-8 text-muted-foreground" />
        <p className="max-w-sm text-sm text-muted-foreground">
          Пока нет расшаренных вакансий. В карточке отклика включите
          «Поделиться с командой», и они появятся здесь.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {vacancies.map((v) => (
        <VacancyCard key={v.companyKey} vacancy={v} teamId={teamId} onChanged={load} />
      ))}
    </div>
  )
}
