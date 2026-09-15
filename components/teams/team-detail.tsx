"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, Check, Copy, Crown, RefreshCw, Trash, UserPlus, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

import { ActivityFeed } from "./activity-feed"
import { VacancyBoard } from "./vacancy-board"
import type { TeamInfo, TeamMember, TeamRequest, TeamRole, UserSearchResult } from "./types"

const ROLE_LABEL: Record<TeamRole, string> = {
  owner: "Владелец",
  member: "Участник",
  mentor: "Ментор",
  reviewer: "Ревьюер",
}

const NON_OWNER_ROLES: TeamRole[] = ["member", "mentor", "reviewer"]

function RoleBadge({ role }: { role: TeamRole }) {
  return (
    <Badge variant={role === "owner" ? "default" : "secondary"}>
      {role === "owner" ? <Crown className="size-3" /> : null}
      {ROLE_LABEL[role]}
    </Badge>
  )
}

function InviteSearch({ teamId, onDone }: { teamId: string; onDone: () => void }) {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [role, setRole] = useState<TeamRole>("member")
  const [searched, setSearched] = useState(false)
  const [busy, setBusy] = useState(false)

  async function search() {
    if (!q.trim()) return
    setBusy(true)
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`)
      if (res.ok) {
        const d = (await res.json()) as { users: UserSearchResult[] }
        setResults(d.users)
        setSearched(true)
      }
    } finally {
      setBusy(false)
    }
  }

  async function invite(user: UserSearchResult) {
    const res = await fetch(`/api/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, role }),
    })
    if (res.ok) {
      toast.success(`${user.name} добавлен(а) как ${ROLE_LABEL[role]}`)
      setResults((prev) => prev.filter((r) => r.id !== user.id))
      onDone()
    } else {
      const d = (await res.json().catch(() => ({}))) as { error?: string }
      toast.error(d?.error ?? "Не удалось добавить")
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-48 flex-1 flex-col gap-1.5">
          <Label>Найти человека</Label>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Имя или email"
          />
        </div>
        <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
          <SelectTrigger size="sm" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NON_OWNER_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABEL[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={search} disabled={busy || !q.trim()}>
          Найти
        </Button>
      </div>

      {searched && results.length === 0 ? (
        <p className="text-sm text-muted-foreground">Никого не нашли.</p>
      ) : null}

      {results.map((u) => (
        <div key={u.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{u.name}</p>
            {u.email ? (
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            ) : null}
          </div>
          <Button size="sm" onClick={() => invite(u)}>
            <UserPlus /> Добавить
          </Button>
        </div>
      ))}
    </div>
  )
}

function SettingsForm({
  team,
  onSaved,
}: {
  team: TeamInfo
  onSaved: (team: TeamInfo) => void
}) {
  const [name, setName] = useState(team.name)
  const [description, setDescription] = useState(team.description ?? "")
  const [domain, setDomain] = useState(team.domain ?? "")
  const [tags, setTags] = useState(team.tags.join(", "))
  const [visibility, setVisibility] = useState(team.visibility)
  const [joinMode, setJoinMode] = useState(team.joinMode)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          domain: domain.trim() || null,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          visibility,
          joinMode,
        }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось сохранить")
      }
      const d = (await res.json()) as { team: TeamInfo }
      onSaved(d.team)
      toast.success("Настройки сохранены")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>Название</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Описание</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Кто вы и какую работу ищете"
          className="min-h-20"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Сфера</Label>
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Frontend, Data, Design…"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Теги (через запятую)</Label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="React, TypeScript"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Видимость</Label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as "public" | "private")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Закрытая (по инвайту)</SelectItem>
              <SelectItem value="public">Публичная (видна в поиске)</SelectItem>
            </SelectContent>
          </Select>
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
      <Button className="w-fit" onClick={save} disabled={saving || !name.trim()}>
        {saving ? "Сохраняем…" : "Сохранить"}
      </Button>
    </div>
  )
}

export function TeamDetail({ teamId }: { teamId: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const myId = session?.user?.id ?? ""

  const [team, setTeam] = useState<TeamInfo | null>(null)
  const [role, setRole] = useState<TeamRole | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [requests, setRequests] = useState<TeamRequest[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch(`/api/teams/${teamId}`)
    if (res.ok) {
      const d = (await res.json()) as {
        team: TeamInfo
        role: TeamRole | null
        members: TeamMember[]
      }
      setTeam(d.team)
      setRole(d.role)
      setMembers(d.members)
      if (d.role === "owner") {
        const reqRes = await fetch(`/api/teams/${teamId}/requests`)
        if (reqRes.ok) {
          const rd = (await reqRes.json()) as { requests: TeamRequest[] }
          setRequests(rd.requests)
        }
      }
    }
    setLoading(false)
  }, [teamId])

  useEffect(() => {
    load()
  }, [load])

  async function changeRole(memberId: string, next: TeamRole) {
    const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    })
    if (res.ok) {
      await load()
    } else {
      toast.error("Не удалось изменить роль")
    }
  }

  async function removeMember(memberId: string) {
    const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      await load()
    } else {
      toast.error("Не удалось выполнить действие")
    }
  }

  async function handleRequest(requestId: string, action: "approve" | "reject") {
    const res = await fetch(`/api/teams/${teamId}/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      await load()
    } else {
      toast.error("Не удалось обработать заявку")
    }
  }

  async function regenerateCode() {
    const res = await fetch(`/api/teams/${teamId}/invite`, { method: "POST" })
    if (res.ok) {
      const d = (await res.json()) as { team: TeamInfo }
      setTeam(d.team)
      toast.success("Новый код приглашения")
    }
  }

  async function copyInvite() {
    if (!team) return
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/teams?code=${team.inviteCode}`
      )
      toast.success("Ссылка скопирована")
    } catch {
      toast.error("Не удалось скопировать")
    }
  }

  async function deleteTeam() {
    const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Команда удалена")
      router.push("/teams")
    } else {
      toast.error("Не удалось удалить команду")
    }
  }

  async function joinOrRequest() {
    if (!team) return
    const res = await fetch(`/api/teams/${teamId}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    if (res.ok) {
      const d = (await res.json()) as { joined: boolean }
      if (d.joined) {
        toast.success("Вы в команде")
        await load()
      } else {
        toast.success("Заявка отправлена — ждите одобрения")
      }
    } else {
      const d = (await res.json().catch(() => ({}))) as { error?: string }
      toast.error(d?.error ?? "Не удалось отправить заявку")
    }
  }

  if (loading) {
    return <Skeleton className="h-64 w-full" />
  }

  if (!team) {
    return <p className="text-sm text-muted-foreground">Команда не найдена</p>
  }

  if (!role) {
    return (
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/teams">
            <ArrowLeft /> Команды
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{team.name}</CardTitle>
            {team.description ? (
              <CardDescription>{team.description}</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {team.domain ? <Badge variant="outline">{team.domain}</Badge> : null}
              {team.tags.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
              <Badge variant="secondary">{members.length} участников</Badge>
            </div>
            <Button className="w-fit" onClick={joinOrRequest}>
              {team.joinMode === "open" ? "Вступить" : "Запросить вступление"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwner = role === "owner"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/teams">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-medium">{team.name}</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} участников · {ROLE_LABEL[role]}
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
          {isOwner ? <TabsTrigger value="settings">Настройки</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="vacancies" className="pt-4">
          <VacancyBoard teamId={teamId} />
        </TabsContent>

        <TabsContent value="activity" className="pt-4">
          <ActivityFeed teamId={teamId} />
        </TabsContent>

        <TabsContent value="members" className="pt-4">
          <div className="flex flex-col gap-4">
            {isOwner ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Пригласить</CardTitle>
                    <CardDescription>
                      Найдите человека по имени или email и добавьте в команду.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InviteSearch teamId={teamId} onDone={load} />
                  </CardContent>
                </Card>

                {requests.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Заявки</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      {requests.map((r) => (
                        <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {r.name}{" "}
                              <span className="text-muted-foreground">
                                · хочет быть {ROLE_LABEL[r.role]}
                              </span>
                            </p>
                            {r.email ? (
                              <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                            ) : null}
                          </div>
                          <Button size="sm" onClick={() => handleRequest(r.id, "approve")}>
                            <Check /> Одобрить
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleRequest(r.id, "reject")}>
                            <X />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}

                <Separator />
              </>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Участники</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {members.map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.name}</p>
                      {m.email ? (
                        <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                      ) : null}
                    </div>
                    <RoleBadge role={m.role} />
                    {isOwner && m.role !== "owner" ? (
                      <>
                        <Select
                          value={m.role}
                          onValueChange={(v) => changeRole(m.id, v as TeamRole)}
                        >
                          <SelectTrigger size="sm" className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {NON_OWNER_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {ROLE_LABEL[r]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => removeMember(m.id)}>
                          <Trash />
                        </Button>
                      </>
                    ) : null}
                    {!isOwner && m.id === myId ? (
                      <Button variant="ghost" size="sm" onClick={() => removeMember(m.id)}>
                        Выйти
                      </Button>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {isOwner ? (
          <TabsContent value="settings" className="pt-4">
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Настройки</CardTitle>
                </CardHeader>
                <CardContent>
                  <SettingsForm
                    team={team}
                    onSaved={(t) => setTeam(t)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Приглашение</CardTitle>
                  <CardDescription>
                    Отправьте ссылку или код друзьям.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <code className="rounded-lg bg-muted px-3 py-1.5 text-sm">{team.inviteCode}</code>
                  <Button variant="outline" size="sm" onClick={copyInvite}>
                    <Copy /> Скопировать ссылку
                  </Button>
                  <Button variant="ghost" size="sm" onClick={regenerateCode}>
                    <RefreshCw /> Новый код
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
