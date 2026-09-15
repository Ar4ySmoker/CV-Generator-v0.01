"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Briefcase, Send, MessagesSquare, Handshake } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Stage {
  id: string
  name: string
  color: string
  type: string
  terminalResult: string | null
}

interface App {
  id: string
  company: string
  role: string
  stageId: string
  sentAt: string | null
  offerSalary: number | null
  offerCurrency: string | null
  updatedAt: string
}

export function DashboardStats() {
  const [stages, setStages] = useState<Stage[]>([])
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)

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

  const stats = useMemo(() => {
    const stageMap = new Map(stages.map((s) => [s.id, s]))
    const stageOf = (id: string) => stageMap.get(id)

    const now = new Date()
    const sentThisMonth = apps.filter((a) => {
      if (!a.sentAt) return false
      const d = new Date(a.sentAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length

    const interviews = apps.filter((a) => {
      const name = stageOf(a.stageId)?.name ?? ""
      return (
        name.toLowerCase().includes("собес") ||
        name.toLowerCase().includes("интервью") ||
        name.toLowerCase().includes("тестовое")
      )
    }).length

    const offers = apps.filter((a) => {
      const s = stageOf(a.stageId)
      return s?.name === "Офер" || s?.terminalResult === "accepted"
    }).length

    const funnel = stages.map((s) => ({
      ...s,
      count: apps.filter((a) => a.stageId === s.id).length,
    }))

    const recent = [...apps]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 5)

    return { total: apps.length, sentThisMonth, interviews, offers, funnel, recent }
  }, [apps, stages])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <Briefcase className="size-4 text-primary" />
            <CardTitle className="text-sm font-medium">Всего откликов</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-medium">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <Send className="size-4 text-primary" />
            <CardTitle className="text-sm font-medium">Отправлено за месяц</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-medium">{stats.sentThisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <MessagesSquare className="size-4 text-primary" />
            <CardTitle className="text-sm font-medium">Собеседования</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-medium">{stats.interviews}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <Handshake className="size-4 text-primary" />
            <CardTitle className="text-sm font-medium">Оферы</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-medium">{stats.offers}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Воронка</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {stats.funnel.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-sm">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="flex-1">{s.name}</span>
                <span className="font-medium">{s.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

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
    </div>
  )
}
