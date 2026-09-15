"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Copy, Crown, LogOut, RefreshCw, Trash, UserPlus, UsersRound } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { VacancyBoard } from "./vacancy-board"
import { ActivityFeed } from "./activity-feed"
import type { TeamInfo, TeamMember } from "./types"

export function TeamsManager() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const myId = session?.user?.id ?? ""

  const [team, setTeam] = useState<TeamInfo | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const [createName, setCreateName] = useState("")
  const [joinCode, setJoinCode] = useState(searchParams.get("code") ?? "")
  const [renameValue, setRenameValue] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch("/api/teams")
    if (res.ok) {
      const d = (await res.json()) as { team: TeamInfo | null }
      setTeam(d.team)
      if (d.team) {
        setRenameValue(d.team.name)
        const detailRes = await fetch(`/api/teams/${d.team.id}`)
        if (detailRes.ok) {
          const dd = (await detailRes.json()) as { members: TeamMember[] }
          setMembers(dd.members)
        }
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function create() {
    if (!createName.trim()) return
    setBusy(true)
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim() }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось создать")
      }
      await load()
      toast.success("Команда создана")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось создать команду")
    } finally {
      setBusy(false)
    }
  }

  async function join() {
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
      await load()
      toast.success("Вы вступили в команду")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось вступить")
    } finally {
      setBusy(false)
    }
  }

  async function rename() {
    if (!team || !renameValue.trim()) return
    const res = await fetch(`/api/teams/${team.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    })
    if (res.ok) {
      toast.success("Название обновлено")
      await load()
    } else {
      toast.error("Не удалось переименовать")
    }
  }

  async function regenerate() {
    if (!team) return
    const res = await fetch(`/api/teams/${team.id}/invite`, { method: "POST" })
    if (res.ok) {
      const d = (await res.json()) as { team: TeamInfo }
      setTeam(d.team)
      toast.success("Новый код приглашения")
    } else {
      toast.error("Не удалось обновить код")
    }
  }

  async function copyInvite() {
    if (!team) return
    const link = `${window.location.origin}/teams?code=${team.inviteCode}`
    try {
      await navigator.clipboard.writeText(link)
      toast.success("Ссылка скопирована")
    } catch {
      toast.error("Не удалось скопировать")
    }
  }

  async function removeMember(memberId: string) {
    if (!team) return
    const res = await fetch(`/api/teams/${team.id}/members/${memberId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      await load()
    } else {
      toast.error("Не удалось выполнить действие")
    }
  }

  async function deleteTeam() {
    if (!team) return
    const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" })
    if (res.ok) {
      setTeam(null)
      setMembers([])
      toast.success("Команда удалена")
    } else {
      toast.error("Не удалось удалить команду")
    }
  }

  if (loading) {
    return <Skeleton className="h-64 w-full" />
  }

  if (!team) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Создать команду</CardTitle>
            <CardDescription>
              Круг друзей, с которыми делитесь вакансиями и опытом собеседований.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Название команды</Label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Напр. Frontend-трек"
              />
            </div>
            <Button onClick={create} disabled={busy || !createName.trim()}>
              <UsersRound /> Создать
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
                placeholder="Код или вставьте ссылку"
              />
            </div>
            <Button
              variant="outline"
              onClick={join}
              disabled={busy || !joinCode.trim()}
            >
              <UserPlus /> Вступить
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwner = team.ownerId === myId

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-medium">{team.name}</h2>
          <p className="text-sm text-muted-foreground">
            {members.length} участников
          </p>
        </div>
        {isOwner ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto text-destructive"
            title="Удалить команду"
            onClick={deleteTeam}
          >
            <Trash />
          </Button>
        ) : null}
      </div>

      <Tabs defaultValue="vacancies" className="w-full">
        <TabsList className="max-w-full justify-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="vacancies">Вакансии</TabsTrigger>
          <TabsTrigger value="activity">Активность</TabsTrigger>
          <TabsTrigger value="members">Участники</TabsTrigger>
        </TabsList>

        <TabsContent value="vacancies" className="pt-4">
          <VacancyBoard teamId={team.id} />
        </TabsContent>

        <TabsContent value="activity" className="pt-4">
          <ActivityFeed teamId={team.id} />
        </TabsContent>

        <TabsContent value="members" className="pt-4">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Приглашение</CardTitle>
                <CardDescription>
                  Отправьте ссылку друзьям — они вступят в команду.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                <code className="rounded-lg bg-muted px-3 py-1.5 text-sm">
                  {team.inviteCode}
                </code>
                <Button variant="outline" size="sm" onClick={copyInvite}>
                  <Copy /> Скопировать ссылку
                </Button>
                {isOwner ? (
                  <Button variant="ghost" size="sm" onClick={regenerate}>
                    <RefreshCw /> Новый код
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            {isOwner ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Название</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={rename}
                    disabled={!renameValue.trim() || renameValue === team.name}
                  >
                    Сохранить
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Участники</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-xl border border-border/60 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-sm font-medium">
                        {m.name}
                        {m.isOwner ? (
                          <Badge variant="secondary">
                            <Crown className="size-3" />
                            Владелец
                          </Badge>
                        ) : null}
                      </p>
                      {m.email ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {m.email}
                        </p>
                      ) : null}
                    </div>
                    {isOwner && !m.isOwner ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive"
                        title="Исключить"
                        onClick={() => removeMember(m.id)}
                      >
                        <Trash />
                      </Button>
                    ) : null}
                    {!isOwner && m.id === myId ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(m.id)}
                      >
                        <LogOut /> Выйти
                      </Button>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
