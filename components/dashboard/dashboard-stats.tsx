"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Briefcase, CalendarClock, Handshake, MessagesSquare, Send } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  INTERVIEW_LABELS,
  type ApplicationItem,
  type InterviewItem,
  type Stage,
} from "@/components/applications/types"
import { ageDays, formatRelative } from "@/lib/format"

import { FunnelChart } from "./funnel-chart"
import { MetricCard } from "./metric-card"

const STUCK_DAYS = 14

export function DashboardStats() {
  const [stages, setStages] = useState<Stage[]>([])
  const [apps, setApps] = useState<ApplicationItem[]>([])
  const [interviews, setInterviews] = useState<InterviewItem[]>([])
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

  const stats = useMemo(() => {
    const stageMap = new Map(stages.map((s) => [s.id, s]))
    const stageOf = (id: string) => stageMap.get(id)

    const now = new Date()
    const sentThisMonth = apps.filter((a) => {
      if (!a.sentAt) return false
      const d = new Date(a.sentAt)
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      )
    }).length

    const sent = apps.filter((a) => a.sentAt).length
    const responded = apps.filter((a) =>
      a.timeline.some((t) => t.type === "response")
    ).length
    const responseRate = sent > 0 ? Math.round((responded / sent) * 100) : null

    const offers = apps.filter((a) => {
      const s = stageOf(a.stageId)
      return s?.name === "Офер" || s?.terminalResult === "accepted"
    }).length

    const interviewCount = interviews.filter(
      (iv) => iv.status === "scheduled" || iv.status === "done"
    ).length

    const counts = new Map<string, number>()
    for (const app of apps) {
      counts.set(app.stageId, (counts.get(app.stageId) ?? 0) + 1)
    }

    const upcoming = interviews
      .filter((iv) => {
        if (iv.status !== "scheduled") return false
        const t = new Date(iv.scheduledAt).getTime()
        return t >= Date.now() && t - Date.now() <= 7 * 24 * 3600 * 1000
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      )

    const stuck = apps.filter((a) => {
      const s = stageOf(a.stageId)
      if (s?.type === "terminal") return false
      if (!a.stageEnteredAt) return false
      return ageDays(a.stageEnteredAt) > STUCK_DAYS
    })

    const recent = [...apps]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 5)

    return {
      total: apps.length,
      sentThisMonth,
      responseRate,
      responded,
      sent,
      offers,
      interviewCount,
      counts,
      upcoming,
      stuck,
      recent,
    }
  }, [apps, stages, interviews])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Briefcase} label="Всего откликов" value={stats.total} />
        <MetricCard
          icon={Send}
          label="Отправлено за месяц"
          value={stats.sentThisMonth}
        />
        <MetricCard
          icon={MessagesSquare}
          label="Ответы"
          value={stats.responseRate != null ? `${stats.responseRate}%` : "—"}
          hint={stats.responseRate != null ? `${stats.responded} из ${stats.sent}` : undefined}
        />
        <MetricCard icon={Handshake} label="Оферы" value={stats.offers} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Воронка</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart stages={stages} counts={stats.counts} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ближайшие события</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {stats.upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Событий в ближайшие 7 дней нет.
                </p>
              ) : (
                stats.upcoming.map((iv) => (
                  <Link
                    key={iv.id}
                    href={`/applications/${iv.applicationId}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-muted"
                  >
                    <CalendarClock className="size-4 text-primary" />
                    <span className="truncate font-medium">
                      {iv.role ?? ""} · {iv.company ?? ""}
                    </span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {INTERVIEW_LABELS[iv.type]} · {formatRelative(iv.scheduledAt)}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Застрявшие (без движения &gt; {STUCK_DAYS} дн)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {stats.stuck.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Всё движется. Так держать.
                </p>
              ) : (
                stats.stuck.map((a) => (
                  <Link
                    key={a.id}
                    href={`/applications/${a.id}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-muted"
                  >
                    <span className="truncate font-medium">{a.role}</span>
                    <span className="truncate text-muted-foreground">
                      {a.company}
                    </span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {a.stageEnteredAt ? `${ageDays(a.stageEnteredAt)} дн` : ""}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Последние отклики</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {stats.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока пусто</p>
          ) : (
            stats.recent.map((a) => (
              <Link
                key={a.id}
                href={`/applications/${a.id}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-muted"
              >
                <span className="truncate font-medium">{a.role}</span>
                <span className="truncate text-muted-foreground">
                  {a.company}
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
