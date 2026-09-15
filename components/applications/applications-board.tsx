"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Briefcase,
  CalendarClock,
  Clock,
  Columns3,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { formatRelative, salaryRange, timeInStage } from "@/lib/format"

import { CompanyLogo } from "./company-logo"
import { PipelineBoard } from "./pipeline-board"
import { StageBadge } from "./stage-badge"
import {
  INTERVIEW_LABELS,
  type ApplicationItem,
  type InterviewItem,
  type Stage,
} from "./types"

type Mode = "kanban" | "upcoming" | "recent"

function nextScheduledEvent(
  appId: string,
  interviews: InterviewItem[]
): InterviewItem | null {
  const now = Date.now()
  let best: InterviewItem | null = null
  for (const iv of interviews) {
    if (iv.applicationId !== appId || iv.status !== "scheduled") continue
    if (new Date(iv.scheduledAt).getTime() < now) continue
    if (!best || new Date(iv.scheduledAt).getTime() < new Date(best.scheduledAt).getTime()) {
      best = iv
    }
  }
  return best
}

function ListRow({
  app,
  stages,
  nextEvent,
  onMove,
}: {
  app: ApplicationItem
  stages: Stage[]
  nextEvent: InterviewItem | null
  onMove: (appId: string, stageId: string) => void
}) {
  const router = useRouter()
  const stage = stages.find((s) => s.id === app.stageId)
  const age = app.stageEnteredAt ? timeInStage(app.stageEnteredAt) : null

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
      <button
        type="button"
        onClick={() => router.push(`/applications/${app.id}`)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <CompanyLogo domain={app.companyDomain} name={app.company} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{app.role}</p>
          <p className="truncate text-xs text-muted-foreground">
            {app.company}
            {app.country ? ` · ${app.country}` : ""}
          </p>
        </div>
        {age ? (
          <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
            <Clock className="size-3" />
            {age}
          </span>
        ) : null}
        {nextEvent ? (
          <span className="hidden items-center gap-1 text-xs text-primary sm:flex">
            <CalendarClock className="size-3" />
            {INTERVIEW_LABELS[nextEvent.type]} · {formatRelative(nextEvent.scheduledAt)}
          </span>
        ) : null}
        <span className="hidden text-xs text-muted-foreground md:inline">
          {salaryRange(app.salaryMin, app.salaryMax, app.currency)}
        </span>
        <StageBadge stage={stage} />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="shrink-0">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/applications/${app.id}`)}>
            <ExternalLink />
            Открыть
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Перевести в этап</DropdownMenuLabel>
          {stages.map((s) => (
            <DropdownMenuItem
              key={s.id}
              disabled={s.id === app.stageId}
              onClick={() => onMove(app.id, s.id)}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function ApplicationsBoard() {
  const [stages, setStages] = useState<Stage[]>([])
  const [apps, setApps] = useState<ApplicationItem[]>([])
  const [interviews, setInterviews] = useState<InterviewItem[]>([])
  const [mode, setMode] = useState<Mode>("kanban")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [stagesRes, appsRes, interviewsRes] = await Promise.all([
      fetch("/api/stages"),
      fetch("/api/applications"),
      fetch("/api/interviews"),
    ])
    if (stagesRes.ok) {
      const d = (await stagesRes.json()) as { stages: Stage[] }
      setStages(d.stages)
    }
    if (appsRes.ok) {
      const d = (await appsRes.json()) as { applications: ApplicationItem[] }
      setApps(d.applications)
    }
    if (interviewsRes.ok) {
      const d = (await interviewsRes.json()) as { interviews: InterviewItem[] }
      setInterviews(d.interviews)
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
      const eventAt = (a: ApplicationItem) => {
        const ev = nextScheduledEvent(a.id, interviews)
        return ev ? new Date(ev.scheduledAt).getTime() : Infinity
      }
      return list.sort((a, b) => eventAt(a) - eventAt(b))
    }
    if (mode === "recent") {
      return list.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    }
    return list
  }, [filtered, mode, interviews])

  const soon = useMemo(() => {
    const now = Date.now()
    const week = 7 * 24 * 3600 * 1000
    return interviews
      .filter((iv) => {
        if (iv.status !== "scheduled") return false
        const t = new Date(iv.scheduledAt).getTime()
        return t >= now && t - now <= week
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      )
  }, [interviews])

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-9 w-full max-w-xs" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex min-w-60 flex-1 flex-col gap-2 rounded-xl border border-border/60 bg-muted/30 p-2"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-16 text-center">
        <Briefcase className="size-8 text-muted-foreground" />
        <p className="max-w-sm text-sm text-muted-foreground">
          Откликов пока нет. Добавьте первую вакансию, чтобы начать трекинг —
          от отправки CV до офера.
        </p>
        <Button asChild size="sm">
          <Link href="/applications/new">
            <Plus /> Первый отклик
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Поиск по компании или роли"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
          <div className="flex rounded-xl border border-border/60 p-1">
            <Button
              variant={mode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("kanban")}
            >
              <Columns3 /> <span className="hidden sm:inline">Воронка</span>
            </Button>
            <Button
              variant={mode === "upcoming" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("upcoming")}
            >
              <CalendarClock />{" "}
              <span className="hidden sm:inline">События</span>
            </Button>
            <Button
              variant={mode === "recent" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("recent")}
            >
              <Clock /> <span className="hidden sm:inline">Недавние</span>
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
          {soon.map((iv) => (
            <Link
              key={iv.id}
              href={`/applications/${iv.applicationId}`}
              className="rounded-lg bg-card px-2 py-1 text-xs hover:bg-muted"
            >
              {iv.role ?? ""} · {iv.company ?? ""} ·{" "}
              {INTERVIEW_LABELS[iv.type]} · {formatRelative(iv.scheduledAt)}
            </Link>
          ))}
        </div>
      ) : null}

      {mode === "kanban" ? (
        <PipelineBoard
          stages={stages}
          apps={filtered}
          interviews={interviews}
          onMove={moveTo}
        />
      ) : (
        <div className="flex flex-col gap-1">
          {sorted.map((app) => (
            <ListRow
              key={app.id}
              app={app}
              stages={stages}
              nextEvent={nextScheduledEvent(app.id, interviews)}
              onMove={moveTo}
            />
          ))}
        </div>
      )}
    </div>
  )
}
