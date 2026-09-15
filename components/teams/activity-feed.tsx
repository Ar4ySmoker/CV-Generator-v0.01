"use client"

import { useCallback, useEffect, useState } from "react"
import { GitBranch, MessageSquare, Share2, type LucideIcon } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"

interface ActivityItem {
  id: string
  type: "shared" | "feedback" | "stage"
  actorName: string
  company: string | null
  role: string | null
  stageName: string | null
  feedbackKind: string | null
  createdAt: string
}

const TYPE_META: Record<ActivityItem["type"], { icon: LucideIcon }> = {
  shared: { icon: Share2 },
  feedback: { icon: MessageSquare },
  stage: { icon: GitBranch },
}

function describe(a: ActivityItem): string {
  if (a.type === "shared") {
    return `${a.actorName} поделился(ась) откликом: ${a.role ?? ""}${
      a.company ? ` · ${a.company}` : ""
    }`
  }
  if (a.type === "stage") {
    return `${a.actorName}: ${a.company ?? ""} — этап «${a.stageName ?? ""}»`
  }
  return `${a.actorName} оставил(а) отзыв о ${a.company ?? ""}`
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ActivityFeed({ teamId }: { teamId: string }) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch(`/api/teams/${teamId}/activity`)
    if (res.ok) {
      const d = (await res.json()) as { activities: ActivityItem[] }
      setActivities(d.activities)
    }
    setLoading(false)
  }, [teamId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Активности пока нет. Делитесь откликами и оставляйте отзывы — они
        появятся здесь.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {activities.map((a) => {
        const Icon = TYPE_META[a.type].icon
        return (
          <div
            key={a.id}
            className="flex items-start gap-3 rounded-xl border border-border/60 p-3"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon className="size-3.5 text-muted-foreground" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-sm">{describe(a)}</p>
              <p className="text-xs text-muted-foreground">
                {timeLabel(a.createdAt)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
