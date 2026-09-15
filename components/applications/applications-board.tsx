"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CalendarClock, Clock, Columns3, Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Stage {
  id: string
  name: string
  order: number
  color: string
  type: string
  terminalResult: string | null
}

interface App {
  id: string
  company: string
  role: string
  country: string | null
  salaryMin: number | null
  salaryMax: number | null
  currency: string | null
  sourceType: string | null
  stageId: string
  sentChannel: string | null
  sentTo: string | null
  sentAt: string | null
  nextEventType: string | null
  nextEventAt: string | null
  nextEventChannel: string | null
  offerSalary: number | null
  offerCurrency: string | null
  updatedAt: string
}

type Mode = "kanban" | "upcoming" | "recent"

function salaryText(a: App): string {
  const cur = a.currency ?? ""
  if (a.salaryMin != null || a.salaryMax != null) {
    const min = a.salaryMin != null ? String(a.salaryMin) : ""
    const max = a.salaryMax != null ? String(a.salaryMax) : ""
    const range = max && min !== max ? `${min}–${max}` : min || max
    return cur ? `${range} ${cur}` : range
  }
  return ""
}

function sentText(a: App): string | null {
  if (!a.sentAt) return null
  const d = new Date(a.sentAt).toLocaleDateString("ru-RU")
  return a.sentChannel ? `${a.sentChannel} · ${d}` : `Отправлено · ${d}`
}

function eventText(a: App): string | null {
  if (!a.nextEventAt) return null
  const mins = Math.round((new Date(a.nextEventAt).getTime() - Date.now()) / 60000)
  const rel =
    mins < 0
      ? "прошло"
      : mins < 60
        ? `через ${mins} мин`
        : mins < 1440
          ? `через ${Math.round(mins / 60)} ч`
          : `через ${Math.round(mins / 1440)} дн`
  return `${a.nextEventType ?? "Событие"} · ${rel}`
}

function EventBadge({ app }: { app: App }) {
  const text = eventText(app)
  if (!text) return null
  return (
    <span className="w-fit rounded-md bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
      {text}
    </span>
  )
}

function AppCard({
  app,
  onDragStart,
  onDragEnd,
}: {
  app: App
  onDragStart: (id: string) => void
  onDragEnd: () => void
}) {
  const router = useRouter()
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move"
        onDragStart(app.id)
      }}
      onDragEnd={onDragEnd}
      onClick={() => router.push(`/applications/${app.id}`)}
      className="flex cursor-grab flex-col gap-1 rounded-xl border border-border/60 bg-card p-3 transition-shadow hover:shadow-sm active:cursor-grabbing"
    >
      <p className="text-sm font-medium leading-snug">{app.role}</p>
      <p className="text-xs text-muted-foreground">{app.company}</p>
      <EventBadge app={app} />
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {app.country ? <span>{app.country}</span> : null}
        {salaryText(app) ? <span>{salaryText(app)}</span> : null}
        {sentText(app) ? <span>{sentText(app)}</span> : null}
      </div>
    </div>
  )
}

export function ApplicationsBoard() {
  const [stages, setStages] = useState<Stage[]>([])
  const [apps, setApps] = useState<App[]>([])
  const [mode, setMode] = useState<Mode>("kanban")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [stagesRes, appsRes] = await Promise.all([
      fetch("/api/stages"),
      fetch("/api/applications"),
    ])
    if (stagesRes.ok) {
      const d = (await stagesRes.json()) as { stages: Stage[] }
      setStages(d.stages)
    }
    if (appsRes.ok) {
      const d = (await appsRes.json()) as { applications: App[] }
      setApps(d.applications)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function moveTo(appId: string, stageId: string) {
    await fetch(`/api/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId }),
    })
    await load()
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return apps
    return apps.filter(
      (a) =>
        a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
    )
  }, [apps, search])

  const sorted = useMemo(() => {
    const list = [...filtered]
    if (mode === "upcoming") {
      return list.sort((a, b) => {
        const at = a.nextEventAt ? new Date(a.nextEventAt).getTime() : Infinity
        const bt = b.nextEventAt ? new Date(b.nextEventAt).getTime() : Infinity
        return at - bt
      })
    }
    if (mode === "recent") {
      return list.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    }
    return list
  }, [filtered, mode])

  const soon = useMemo(() => {
    const now = Date.now()
    const week = 7 * 24 * 3600 * 1000
    return apps
      .filter((a) => {
        if (!a.nextEventAt) return false
        const t = new Date(a.nextEventAt).getTime()
        return t >= now && t - now <= week
      })
      .sort(
        (a, b) =>
          new Date(a.nextEventAt!).getTime() - new Date(b.nextEventAt!).getTime()
      )
  }, [apps])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  const list = mode === "kanban" ? filtered : sorted

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Поиск по компании или роли"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border/60 p-1">
            <Button
              variant={mode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("kanban")}
            >
              <Columns3 /> Воронка
            </Button>
            <Button
              variant={mode === "upcoming" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("upcoming")}
            >
              <CalendarClock /> События
            </Button>
            <Button
              variant={mode === "recent" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("recent")}
            >
              <Clock /> Недавние
            </Button>
          </div>
          <Button asChild size="sm">
            <Link href="/applications/new">
              <Plus /> Отклик
            </Link>
          </Button>
        </div>
      </div>

      {soon.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/30 p-3">
          <span className="text-xs font-medium text-muted-foreground">
            Скоро:
          </span>
          {soon.map((a) => (
            <Link
              key={a.id}
              href={`/applications/${a.id}`}
              className="rounded-lg bg-card px-2 py-1 text-xs hover:bg-muted"
            >
              {a.role} · {a.company} · {eventText(a)}
            </Link>
          ))}
        </div>
      ) : null}

      {mode === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const items = filtered.filter((a) => a.stageId === stage.id)
            return (
              <div
                key={stage.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (draggingId) moveTo(draggingId, stage.id)
                  setDraggingId(null)
                }}
                className="flex min-w-60 flex-1 flex-col gap-2 rounded-xl border border-border/60 bg-muted/30 p-2"
              >
                <div className="flex items-center gap-2 px-1 py-1">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm font-medium">{stage.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((a) => (
                    <AppCard
                      key={a.id}
                      app={a}
                      onDragStart={setDraggingId}
                      onDragEnd={() => setDraggingId(null)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {list.map((a) => {
            const stage = stages.find((s) => s.id === a.stageId)
            return (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 p-3"
              >
                <Link
                  href={`/applications/${a.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-medium">{a.role}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.company}
                    {a.country ? ` · ${a.country}` : ""}
                  </p>
                </Link>
                <EventBadge app={a} />
                <span className="text-xs text-muted-foreground">
                  {salaryText(a)}
                </span>
                {sentText(a) ? (
                  <span className="text-xs text-muted-foreground">
                    {sentText(a)}
                  </span>
                ) : null}
                <select
                  value={a.stageId}
                  onChange={(e) => moveTo(a.id, e.target.value)}
                  className="rounded-lg border border-input bg-input/30 px-2 py-1.5 text-xs"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: stage?.color }}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
