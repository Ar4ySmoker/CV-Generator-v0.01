"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Copy, Plus, UserPlus, UsersRound } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

function normalizeInviteCode(raw: string): string {
  const t = raw.trim()
  const m = t.match(/[?&]code=([^&]+)/)
  return m ? m[1] : t
}

export function TeamsManager() {
  const searchParams = useSearchParams()
  const [teams, setTeams] = useState<MyTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("mine")

  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [domain, setDomain] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private">("private")
  const [joinMode, setJoinMode] = useState<"open" | "request">("request")
  const [createdInvite, setCreatedInvite] = useState<string | null>(null)

  const [joinCode, setJoinCode] = useState(searchParams.get("code") ?? "")

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

  function openCreate() {
    setCreatedInvite(null)
    setName("")
    setDescription("")
    setDomain("")
    setVisibility("private")
    setJoinMode("request")
    setCreateOpen(true)
  }

  function closeCreate() {
    setCreateOpen(false)
    setCreatedInvite(null)
  }

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
      const d = (await res.json()) as { team: { inviteCode: string } }
      setCreatedInvite(d.team.inviteCode)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось создать")
    } finally {
      setBusy(false)
    }
  }

  async function copyInvite() {
    if (!createdInvite) return
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/teams?code=${createdInvite}`
      )
      toast.success("Ссылка скопирована")
    } catch {
      toast.error("Не удалось скопировать")
    }
  }

  async function joinByCode() {
    const code = normalizeInviteCode(joinCode)
    if (!code) return
    setBusy(true)
    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось вступить")
      }
      setJoinCode("")
      setJoinOpen(false)
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
    <div className="flex flex-col gap-4">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList className="max-w-full justify-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger value="mine">Мои команды</TabsTrigger>
            <TabsTrigger value="discover">Поиск</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setJoinOpen(true)}
            >
              <UserPlus /> Вступить по коду
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus /> Создать команду
            </Button>
          </div>
        </div>

        <TabsContent value="mine" className="pt-4">
          {teams.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-12 text-center">
              <UsersRound className="size-8 text-muted-foreground" />
              <p className="max-w-sm text-sm text-muted-foreground">
                Вы пока не состоите ни в одной команде. Создайте свою или
                вступите по коду приглашения.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={openCreate}>
                  <Plus /> Создать команду
                </Button>
                <Button variant="outline" size="sm" onClick={() => setJoinOpen(true)}>
                  <UserPlus /> Вступить по коду
                </Button>
              </div>
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
        </TabsContent>

        <TabsContent value="discover" className="pt-4">
          <Discover />
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={(o) => !o && closeCreate()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {createdInvite ? (
            <>
              <DialogHeader>
                <DialogTitle>Команда создана</DialogTitle>
                <DialogDescription>
                  Отправьте друзьям ссылку или код приглашения.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <code className="rounded-lg bg-muted px-3 py-2 text-sm text-center">
                  {createdInvite}
                </code>
                <Button variant="outline" size="sm" onClick={copyInvite}>
                  <Copy /> Скопировать ссылку
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={closeCreate}>Готово</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Создать команду</DialogTitle>
                <DialogDescription>
                  Круг друзей, с которыми делитесь вакансиями и опытом.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
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
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={closeCreate}>
                  Отмена
                </Button>
                <Button onClick={create} disabled={busy || !name.trim()}>
                  {busy ? "Создаём…" : "Создать"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вступить по коду</DialogTitle>
            <DialogDescription>
              Вставьте код или ссылку-приглашение, которую вам прислали.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label>Код приглашения</Label>
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Код или ссылка"
              onKeyDown={(e) => e.key === "Enter" && joinByCode()}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setJoinOpen(false)}>
              Отмена
            </Button>
            <Button onClick={joinByCode} disabled={busy || !joinCode.trim()}>
              {busy ? "Вступаем…" : "Вступить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
