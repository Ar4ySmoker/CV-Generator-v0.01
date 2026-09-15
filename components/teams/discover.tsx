"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Search, UsersRound } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

import type { DiscoverTeam } from "./types"

export function Discover() {
  const [teams, setTeams] = useState<DiscoverTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [domain, setDomain] = useState("")

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    if (domain.trim()) params.set("domain", domain.trim())
    const res = await fetch(`/api/teams/discover?${params.toString()}`)
    if (res.ok) {
      const d = (await res.json()) as { teams: DiscoverTeam[] }
      setTeams(d.teams)
    }
    setLoading(false)
  }, [q, domain])

  useEffect(() => {
    load()
  }, [load])

  async function join(team: DiscoverTeam) {
    const res = await fetch(`/api/teams/${team.id}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    if (res.ok) {
      const d = (await res.json()) as { joined: boolean }
      toast.success(d.joined ? "Вы в команде" : "Заявка отправлена")
      await load()
    } else {
      const d = (await res.json().catch(() => ({}))) as { error?: string }
      toast.error(d?.error ?? "Не удалось вступить")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Поиск команд по названию или описанию"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex min-w-40 flex-col gap-1.5 sm:w-56">
          <Label className="sr-only">Сфера</Label>
          <Input
            placeholder="Сфера (Frontend, Data…)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 py-12 text-center">
          <UsersRound className="size-8 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Публичных команд не найдено. Создайте свою и пригласите друзей.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teams.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <Badge variant="secondary">{t.memberCount} уч.</Badge>
                </div>
                {t.description ? (
                  <CardDescription className="line-clamp-2">
                    {t.description}
                  </CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {t.domain ? <Badge variant="outline">{t.domain}</Badge> : null}
                  {t.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {t.myRole ? (
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/teams/${t.id}`}>Вы в команде</Link>
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => join(t)}>
                      {t.joinMode === "open" ? "Вступить" : "Запросить вступление"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
