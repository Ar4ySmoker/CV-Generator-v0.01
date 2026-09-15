"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Plus, UserPlus, UsersRound } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

import { Discover } from "./discover"
import type { MyTeam, TeamRole } from "./types"

const ROLE_LABEL: Record<TeamRole, string> = {
  owner: "Владелец",
  member: "Участник",
  mentor: "Ментор",
  reviewer: "Ревьюер",
}

export function TeamsManager() {
  const searchParams = useSearchParams()
  const [teams, setTeams] = useState<MyTeam[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [domain, setDomain] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private">("private")
  const [joinMode, setJoinMode] = useState<"open" | "request">("request")
  const [joinCode, setJoinCode] = useState(searchParams.get("code") ?? "")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch("/api/teams")
    if (res.ok) {
      const d = (await res.json()) as { teams: MyTeam[] }
      setTeams(d.teams)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function create() {
    if (!name.trim()) return
    setBusy(true)
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          domain: domain.trim() || undefined,
          visibility,
          joinMode,
        }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось создать")
      }
      setName("")
      setDescription("")
      setDomain("")
      await load()
      toast.success("Команда создана")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось создать")
    } finally {
      setBusy(false)
    }
  }

  async function joinByCode() {
    if (!joinCode.trim()) return
    setBusy(true)
    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim() }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось вступить")
      }
      setJoinCode("")
      await load()
      toast.success("Вы вступили в команду")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось вступить")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <Skeleton className="h-64 w-full" />
  }

  return (
    <Tabs defaultValue="mine" className="w-full">
      <TabsList className="max-w-full justify-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TabsTrigger value="mine">Мои команды</TabsTrigger>
        <TabsTrigger value="discover">Поиск</TabsTrigger>
      </TabsList>

      <TabsContent value="mine" className="pt-4">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Создать команду</CardTitle>
                <CardDescription>
                  Круг друзей, с которыми делитесь вакансиями и опытом.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Название</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Напр. Frontend-трек"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Описание</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Кто вы и какую работу ищете"
                    className="min-h-16"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <Label>Сфера</Label>
                    <Input
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="Frontend"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Видимость</Label>
                    <Select value={visibility} onValueChange={(v) => setVisibility(v as "public" | "private")}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Закрытая</SelectItem>
                        <SelectItem value="public">Публичная</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Вступление</Label>
                  <Select value={joinMode} onValueChange={(v) => setJoinMode(v as "open" | "request")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Открытая (сразу)</SelectItem>
                      <SelectItem value="request">По заявке (одобрение)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={create} disabled={busy || !name.trim()}>
                  <Plus /> Создать
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Вступить по коду</CardTitle>
                <CardDescription>
                  Попросите у друга код или ссылку-приглашение.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Код приглашения</Label>
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Код или ссылка"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={joinByCode}
                  disabled={busy || !joinCode.trim()}
                >
                  <UserPlus /> Вступить
                </Button>
              </CardContent>
            </Card>
          </div>

          {teams.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 py-12 text-center">
              <UsersRound className="size-8 text-muted-foreground" />
              <p className="max-w-sm text-sm text-muted-foreground">
                Вы пока не состоите ни в одной команде. Создайте свою или
                найдите публичную во вкладке «Поиск».
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {teams.map(({ team, role }) => (
                <Link key={team.id} href={`/teams/${team.id}`}>
                  <Card className="transition-colors hover:border-primary/50">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">{team.name}</CardTitle>
                        <Badge variant={role === "owner" ? "default" : "secondary"}>
                          {ROLE_LABEL[role]}
                        </Badge>
                      </div>
                      {team.description ? (
                        <CardDescription className="line-clamp-2">
                          {team.description}
                        </CardDescription>
                      ) : null}
                    </CardHeader>
                    {team.domain || team.tags.length > 0 ? (
                      <CardContent className="flex flex-wrap gap-1.5 pt-0">
                        {team.domain ? <Badge variant="outline">{team.domain}</Badge> : null}
                        {team.tags.slice(0, 4).map((t) => (
                          <Badge key={t} variant="secondary">
                            {t}
                          </Badge>
                        ))}
                      </CardContent>
                    ) : null}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="discover" className="pt-4">
        <Discover />
      </TabsContent>
    </Tabs>
  )
}
