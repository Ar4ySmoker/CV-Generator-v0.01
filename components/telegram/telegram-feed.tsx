"use client"

import { Fragment, useCallback, useEffect, useState, type ReactNode } from "react"
import { ExternalLink, ChevronDown, Plus, RefreshCw, Send, Trash } from "lucide-react"
import { toast } from "sonner"

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
  segments: { text: string; url: string | null }[]
  url: string
  postedAt: string | null
}

function channelColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0
  }
  return `hsl(${h % 360}, 55%, 45%)`
}

function timeLabel(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  }
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

const LINK_PATTERN =
  /(https?:\/\/[^\s]+|www\.[^\s]+|t\.me\/[^\s]+|[\w-]+\.(?:ru|com|app|io|org|net|dev|co|me|site|pro)(?:\/[^\s]*)?)/g

const IS_LINK =
  /^(https?:\/\/|www\.|t\.me\/|[\w-]+\.(?:ru|com|app|io|org|net|dev|co|me|site|pro))/

function cleanUrl(raw: string): string {
  return raw.replace(/[.,;:!?)\]]+$/, "")
}

function toHref(raw: string): string {
  const cleaned = cleanUrl(raw)
  return /^https?:\/\//.test(cleaned) ? cleaned : `https://${cleaned}`
}

function renderLinks(text: string, prefix = ""): ReactNode {
  const parts = text.split(LINK_PATTERN)
  return parts.map((part, i) => {
    const key = `${prefix}${i}`
    if (IS_LINK.test(part)) {
      const cleaned = cleanUrl(part)
      return (
        <a
          key={key}
          href={toHref(part)}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-primary underline decoration-primary/40 underline-offset-2 hover:opacity-80"
        >
          {cleaned}
        </a>
      )
    }
    return <span key={key}>{part}</span>
  })
}

function renderSegments(
  segments: { text: string; url: string | null }[]
): ReactNode {
  return segments.map((seg, i) => {
    if (seg.url) {
      return (
        <a
          key={`s${i}`}
          href={seg.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-primary underline decoration-primary/40 underline-offset-2 hover:opacity-80"
        >
          {seg.text}
        </a>
      )
    }
    return <Fragment key={`s${i}`}>{renderLinks(seg.text, `s${i}-`)}</Fragment>
  })
}

function groupPosts(posts: Post[]): { channel: string; posts: Post[] }[] {
  const byChannel = new Map<string, Post[]>()
  const order: string[] = []
  for (const p of posts) {
    if (!byChannel.has(p.channel)) {
      byChannel.set(p.channel, [])
      order.push(p.channel)
    }
    byChannel.get(p.channel)!.push(p)
  }
  return order.map((c) => ({ channel: c, posts: byChannel.get(c)! }))
}

export function TelegramFeed() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [errors, setErrors] = useState<{ channel: string; error: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [newChannel, setNewChannel] = useState("")
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggleChannel(channel: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(channel)) next.delete(channel)
      else next.add(channel)
      return next
    })
  }

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
            {groupPosts(posts).map(({ channel, posts: channelPosts }) => {
              const isOpen = expanded.has(channel)
              const latest = channelPosts[0]?.text ?? ""
              return (
                <div key={channel} className="rounded-xl border border-border/60">
                  <button
                    type="button"
                    onClick={() => toggleChannel(channel)}
                    className="flex w-full flex-col gap-1 p-3 text-left"
                  >
                    <div className="flex w-full items-center gap-3">
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                        style={{ backgroundColor: channelColor(channel) }}
                      >
                        {channel.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span
                          className="text-sm font-medium"
                          style={{ color: channelColor(channel) }}
                        >
                          @{channel}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {channelPosts.length}
                      </span>
                      <ChevronDown
                        className={`size-4 text-muted-foreground transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    {!isOpen && latest ? (
                      <p className="line-clamp-1 pl-12 text-xs text-muted-foreground">
                        {latest}
                      </p>
                    ) : null}
                  </button>

                  {isOpen ? (
                    <div className="flex flex-col gap-4 border-t border-border/60 p-3">
                      {channelPosts.map((p) => (
                        <div key={p.id} className="flex items-start gap-3">
                          <div
                            className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                            style={{ backgroundColor: channelColor(p.channel) }}
                          >
                            {p.channel.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <div className="w-fit max-w-full rounded-2xl rounded-tl-md bg-muted px-3 py-2">
                              <p className="whitespace-pre-wrap break-words text-sm">
                                {renderSegments(p.segments)}
                              </p>
                              <div className="mt-1 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
                                {timeLabel(p.postedAt)}
                                <a
                                  href={p.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Открыть пост"
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <ExternalLink className="size-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
