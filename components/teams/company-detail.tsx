"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { ArrowLeft, Building2, ExternalLink, Pencil, Send, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

import { FeedbackForm, FeedbackList, OutcomeBadge } from "./company-shared"
import type { CompanyApplicant, CompanyDetail, TeamMessageItem } from "./types"

const TIMELINE_LABELS: Record<string, string> = {
  stage_change: "Этап",
  sent: "Отправлено",
  response: "Ответ",
  interview: "Собеседование",
  offer: "Офер",
  note: "Заметка",
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function MemberDialog({
  applicant,
  onClose,
}: {
  applicant: CompanyApplicant | null
  onClose: () => void
}) {
  return (
    <Dialog open={!!applicant} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{applicant?.memberName}</DialogTitle>
          <DialogDescription>
            {applicant?.role
              ? `${applicant.role} · ${applicant.stage}`
              : applicant?.stage}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {applicant?.memberEmail ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Email:</span>
              <a
                href={`mailto:${applicant.memberEmail}`}
                className="hover:underline"
              >
                {applicant.memberEmail}
              </a>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Статус:</span>
            <OutcomeBadge outcome={applicant?.outcome ?? "in-progress"} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function CompanyDetail({
  teamId,
  companyKey,
}: {
  teamId: string
  companyKey: string
}) {
  const { data: session } = useSession()
  const myId = session?.user?.id ?? ""

  const [data, setData] = useState<CompanyDetail | null>(null)
  const [messages, setMessages] = useState<TeamMessageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [selected, setSelected] = useState<CompanyApplicant | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/teams/${teamId}/companies/${encodeURIComponent(companyKey)}`
    )
    if (res.ok) {
      setData((await res.json()) as CompanyDetail)
    }
    setLoading(false)
  }, [teamId, companyKey])

  const loadMessages = useCallback(async () => {
    const res = await fetch(
      `/api/teams/${teamId}/companies/${encodeURIComponent(companyKey)}/messages`
    )
    if (res.ok) {
      const d = (await res.json()) as { messages: TeamMessageItem[] }
      setMessages(d.messages)
    }
  }, [teamId, companyKey])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadMessages()
    const t = setInterval(loadMessages, 15000)
    return () => clearInterval(t)
  }, [loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  async function send() {
    if (!text.trim()) return
    setSending(true)
    try {
      await fetch(
        `/api/teams/${teamId}/companies/${encodeURIComponent(companyKey)}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        }
      )
      setText("")
      await loadMessages()
    } finally {
      setSending(false)
    }
  }

  function startEdit(m: TeamMessageItem) {
    setEditingId(m.id)
    setEditText(m.text)
  }

  async function saveEdit() {
    if (!editingId || !editText.trim()) return
    await fetch(
      `/api/teams/${teamId}/companies/${encodeURIComponent(companyKey)}/messages/${editingId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText.trim() }),
      }
    )
    setEditingId(null)
    setEditText("")
    await loadMessages()
  }

  async function deleteMessage(messageId: string) {
    await fetch(
      `/api/teams/${teamId}/companies/${encodeURIComponent(companyKey)}/messages/${messageId}`,
      { method: "DELETE" }
    )
    await loadMessages()
  }

  if (loading) {
    return <Skeleton className="h-64 w-full" />
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href={`/teams/${teamId}`}>
            <ArrowLeft /> Назад
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Вакансия не найдена</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href={`/teams/${teamId}`}>
            <ArrowLeft />
          </Link>
        </Button>
        <Building2 className="size-5 text-primary" />
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-medium">{data.company}</h1>
          <p className="text-sm text-muted-foreground">
            {data.applicants.length} участников
          </p>
        </div>
      </div>

      {data.vacancy ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Вакансия</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.vacancy.sourceUrl ? (
              <a
                href={data.vacancy.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="size-4" />
                {data.vacancy.sourceUrl}
              </a>
            ) : null}
            {data.vacancy.vacancyText ? (
              <ScrollArea className="max-h-64 rounded-xl border border-border/60">
                <p className="whitespace-pre-wrap p-3 text-sm text-muted-foreground">
                  {data.vacancy.vacancyText}
                </p>
              </ScrollArea>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-medium">Участники</h2>
        {data.applicants.map((a) => (
          <div key={a.applicationId} className="flex flex-col gap-2 rounded-xl border border-border/60 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelected(a)}
                className="text-sm font-medium hover:underline"
              >
                {a.memberName}
              </button>
              {a.role ? (
                <span className="text-xs text-muted-foreground">{a.role}</span>
              ) : null}
              <span className="ml-auto flex flex-wrap items-center gap-1.5">
                <OutcomeBadge outcome={a.outcome} />
                <span className="text-xs text-muted-foreground">{a.stage}</span>
              </span>
            </div>

            {a.salary || a.offer || a.notes ? (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {a.salary ? (
                  <span>
                    {a.salary.min != null || a.salary.max != null
                      ? `${a.salary.min ?? ""}${a.salary.max && a.salary.max !== a.salary.min ? `–${a.salary.max}` : ""} ${a.salary.currency ?? ""}`
                      : ""}
                  </span>
                ) : null}
                {a.offer ? (
                  <span className="text-primary">
                    Офер: {a.offer.salary} {a.offer.currency ?? ""}
                  </span>
                ) : null}
                {a.notes ? <span>{a.notes}</span> : null}
              </div>
            ) : null}

            {a.timeline.length > 0 ? (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-muted-foreground">Таймлайн</p>
                {[...a.timeline]
                  .sort(
                    (x, y) =>
                      new Date(y.at).getTime() - new Date(x.at).getTime()
                  )
                  .map((e, i) => (
                    <div key={i} className="flex flex-col gap-0.5 text-xs">
                      <div className="flex items-baseline gap-2">
                        <span className="text-foreground">
                          {TIMELINE_LABELS[e.type] ?? e.type}
                          {e.stageName ? ` · ${e.stageName}` : ""}
                        </span>
                        <span className="ml-auto shrink-0 text-muted-foreground">
                          {timeLabel(e.at)}
                        </span>
                      </div>
                      {e.note ? (
                        <p className="text-muted-foreground">{e.note}</p>
                      ) : null}
                    </div>
                  ))}
              </div>
            ) : null}
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-medium">Отзывы</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFeedback((v) => !v)}
          >
            {showFeedback ? "Скрыть" : "Оставить отзыв"}
          </Button>
        </div>
        {showFeedback ? (
          <FeedbackForm
            teamId={teamId}
            companyKey={data.companyKey}
            company={data.company}
            onSaved={() => {
              setShowFeedback(false)
              load()
            }}
          />
        ) : null}
        {data.feedback.length > 0 ? (
          <FeedbackList
            teamId={teamId}
            companyKey={data.companyKey}
            company={data.company}
            feedback={data.feedback}
            onChanged={load}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Отзывов пока нет.</p>
        )}
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-base font-medium">Чат по вакансии</h2>
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <ScrollArea className="max-h-80">
              <div className="flex flex-col gap-2">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Сообщений пока нет. Обсудите вакансию с командой.
                  </p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col gap-0.5 ${
                        m.authorId === myId ? "items-end" : "items-start"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {m.authorId === myId && editingId === m.id ? (
                          <>
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="text-primary hover:underline"
                            >
                              Сохранить
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="hover:underline"
                            >
                              Отмена
                            </button>
                          </>
                        ) : m.authorId === myId ? (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(m)}
                              className="hover:text-foreground"
                              title="Редактировать"
                            >
                              <Pencil className="size-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMessage(m.id)}
                              className="hover:text-destructive"
                              title="Удалить"
                            >
                              <Trash className="size-3" />
                            </button>
                          </>
                        ) : null}
                        <span>
                          {m.authorName} · {timeLabel(m.createdAt)}
                        </span>
                      </span>
                      {editingId === m.id ? (
                        <Input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                          className="max-w-[85%]"
                        />
                      ) : (
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                            m.authorId === myId
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {m.text}
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
            <div className="flex items-center gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Написать сообщение…"
              />
              <Button size="icon" onClick={send} disabled={sending || !text.trim()}>
                <Send />
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <MemberDialog applicant={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
