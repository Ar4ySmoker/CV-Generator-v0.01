"use client"

import { useCallback, useEffect, useState } from "react"
import { ExternalLink, Plus, RefreshCw, Send, Trash } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

interface Channel {
  id: string
  username: string
}

interface Post {
  id: string
  channel: string
  text: string
  url: string
  postedAt: string | null
}

function timeLabel(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function TelegramFeed() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [errors, setErrors] = useState<{ channel: string; error: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [newChannel, setNewChannel] = useState("")
  const [adding, setAdding] = useState(false)

  const loadChannels = useCallback(async () => {
    const res = await fetch("/api/telegram/channels")
    if (res.ok) {
      const d = (await res.json()) as { channels: Channel[]; isAdmin: boolean }
      setChannels(d.channels)
      setIsAdmin(d.isAdmin)
    }
  }, [])

  const loadFeed = useCallback(async (refresh = false) => {
    const res = await fetch(`/api/telegram/feed${refresh ? "?refresh=1" : ""}`)
    if (res.ok) {
      const d = (await res.json()) as {
        posts: Post[]
        errors: { channel: string; error: string }[]
      }
      setPosts(d.posts)
      setErrors(d.errors)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadChannels()
    loadFeed()
  }, [loadChannels, loadFeed])

  async function addChannel() {
    if (!newChannel.trim()) return
    setAdding(true)
    try {
      const res = await fetch("/api/telegram/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newChannel.trim() }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось добавить")
      }
      setNewChannel("")
      toast.success("Канал добавлен")
      await loadChannels()
      await loadFeed(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось добавить")
    } finally {
      setAdding(false)
    }
  }

  async function removeChannel(id: string) {
    const res = await fetch(`/api/telegram/channels/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Канал удалён")
      await loadChannels()
      await loadFeed(true)
    } else {
      toast.error("Не удалось удалить")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Каналы</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex min-w-48 flex-1 flex-col gap-1.5">
                <Label>Добавить канал</Label>
                <Input
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addChannel()}
                  placeholder="@channel или ссылка t.me/…"
                />
              </div>
              <Button size="sm" onClick={addChannel} disabled={adding || !newChannel.trim()}>
                <Plus /> Добавить
              </Button>
            </div>
            {channels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {channels.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-0.5 text-xs"
                  >
                    @{c.username}
                    <button
                      type="button"
                      onClick={() => removeChannel(c.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Удалить"
                    >
                      <Trash className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Каналов пока нет. Добавьте Telegram-каналы с вакансиями.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {channels.length > 0 ? `Каналы: ${channels.map((c) => "@" + c.username).join(", ")}` : "Лента Telegram-каналов с вакансиями"}
        </p>
        <Button variant="outline" size="sm" onClick={() => loadFeed(true)}>
          <RefreshCw /> Обновить
        </Button>
      </div>

      {errors.length > 0 ? (
        <div className="flex flex-col gap-1 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {errors.map((e) => (
            <p key={e.channel}>
              @{e.channel}: {e.error}
            </p>
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 py-12 text-center">
          <Send className="size-8 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Постов пока нет. Добавьте каналы — свежие вакансии появятся здесь.
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-[70vh]">
          <div className="flex flex-col gap-2">
            {posts.map((p) => (
              <div key={p.id} className="flex flex-col gap-1.5 rounded-xl border border-border/60 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">@{p.channel}</Badge>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {timeLabel(p.postedAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{p.text}</p>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="size-3.5" /> Открыть пост
                </a>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
