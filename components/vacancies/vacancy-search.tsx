"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bookmark, ExternalLink, LoaderCircle, Search, Send } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"

import { salaryRange } from "@/lib/format"
import type { SourceStatus, SourceVacancy } from "@/lib/vacancy-sources"

const CHIPS = ["Frontend", "Backend", "Python", "DevOps", "Data", "Mobile", "QA"]

export function VacancySearch({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: () => void
}) {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [remote, setRemote] = useState(true)
  const [results, setResults] = useState<SourceVacancy[]>([])
  const [sources, setSources] = useState<SourceStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [done, setDone] = useState<Set<string>>(new Set())

  async function search() {
    setLoading(true)
    setDone(new Set())
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set("q", q.trim())
      if (!remote) params.set("remote", "0")
      const res = await fetch(`/api/vacancies/search?${params.toString()}`)
      if (res.ok) {
        const d = (await res.json()) as {
          results: SourceVacancy[]
          sources: SourceStatus[]
        }
        setResults(d.results)
        setSources(d.sources)
      }
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  useEffect(() => {
    if (open && !searched) {
      search()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function importBody(v: SourceVacancy, apply: boolean) {
    return {
      company: v.company,
      role: v.title,
      country: v.location || undefined,
      salaryMin: v.salaryMin ?? null,
      salaryMax: v.salaryMax ?? null,
      currency: v.currency || undefined,
      sourceUrl: v.url,
      sourceType: v.sourceLabel,
      description: v.description || undefined,
      tags: v.tags ?? [],
      apply,
    }
  }

  async function save(v: SourceVacancy) {
    const res = await fetch("/api/vacancies/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(importBody(v, false)),
    })
    if (res.ok) {
      toast.success("Вакансия сохранена")
      setDone((prev) => new Set(prev).add(v.externalId))
      onSaved()
    } else {
      const d = (await res.json().catch(() => ({}))) as { error?: string }
      toast.error(d?.error ?? "Не удалось сохранить")
    }
  }

  async function apply(v: SourceVacancy) {
    const res = await fetch("/api/vacancies/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(importBody(v, true)),
    })
    if (res.ok) {
      const d = (await res.json()) as { applicationId: string | null }
      toast.success("Отклик создан")
      if (d.applicationId) {
        router.push(`/applications/${d.applicationId}`)
      }
    } else {
      const d = (await res.json().catch(() => ({}))) as { error?: string }
      toast.error(d?.error ?? "Не удалось податься")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Найти вакансии</DialogTitle>
          <DialogDescription>
            Живой поиск по hh.ru и Remote OK. По умолчанию — IT с удалёнкой.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Например: frontend, backend, python…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
              />
            </div>
            <Button size="sm" onClick={search} disabled={loading}>
              {loading ? <LoaderCircle className="animate-spin" /> : <Search />}
              Искать
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={remote} onCheckedChange={setRemote} />
            <Label>Только удалёнка</Label>
            <div className="ml-auto flex flex-wrap gap-1">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setQ(c)
                    search()
                  }}
                  className="rounded-full border border-border/60 px-2.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {sources.some((s) => !s.ok) ? (
            <div className="flex flex-col gap-1 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {sources
                .filter((s) => !s.ok)
                .map((s) => (
                  <p key={s.id}>
                    {s.name}: {s.error}
                  </p>
                ))}
            </div>
          ) : null}

          {loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : results.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Ничего не найдено. Попробуйте другой запрос.
            </p>
          ) : (
            <ScrollArea className="max-h-[55vh]">
              <div className="flex flex-col gap-2">
                {results.map((v) => {
                  const salary = salaryRange(
                    v.salaryMin ?? null,
                    v.salaryMax ?? null,
                    v.currency ?? null
                  )
                  const isDone = done.has(v.externalId)
                  return (
                    <div
                      key={`${v.source}-${v.externalId}`}
                      className="flex flex-col gap-2 rounded-xl border border-border/60 p-3"
                    >
                      <div className="flex flex-wrap items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{v.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {v.company}
                            {v.location ? ` · ${v.location}` : ""}
                          </p>
                        </div>
                        <Badge variant="secondary">{v.sourceLabel}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {salary ? <span>{salary}</span> : null}
                      </div>
                      {v.description ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {v.description}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" onClick={() => apply(v)}>
                          <Send /> Податься
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => save(v)}
                          disabled={isDone}
                        >
                          <Bookmark /> {isDone ? "Сохранено" : "Сохранить"}
                        </Button>
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="size-3.5" /> Источник
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
