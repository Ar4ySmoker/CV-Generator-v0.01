import {
  CalendarClock,
  GitBranch,
  Handshake,
  MessageSquare,
  Send,
  StickyNote,
  type LucideIcon,
} from "lucide-react"

import type { TimelineEvent, TimelineEventType } from "./types"

const EVENT_META: Record<TimelineEventType, { label: string; icon: LucideIcon }> = {
  stage_change: { label: "Этап", icon: GitBranch },
  sent: { label: "Отправлено", icon: Send },
  response: { label: "Ответ", icon: MessageSquare },
  interview: { label: "Собеседование", icon: CalendarClock },
  offer: { label: "Офер", icon: Handshake },
  note: { label: "Заметка", icon: StickyNote },
}

export function ActivityTimeline({
  timeline,
}: {
  timeline: TimelineEvent[]
}) {
  const events = [...timeline].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  )

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        История пока пуста. Смена этапа и действия будут записываться здесь.
      </p>
    )
  }

  return (
    <ol className="flex flex-col">
      {events.map((e, i) => {
        const meta = EVENT_META[e.type] ?? EVENT_META.note
        const Icon = meta.icon
        return (
          <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
            {i < events.length - 1 ? (
              <span className="absolute top-6 left-3 h-full w-px bg-border" />
            ) : null}
            <span className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon className="size-3.5 text-muted-foreground" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">
                  {meta.label}
                  {e.stageName ? ` · ${e.stageName}` : ""}
                </span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {new Date(e.at).toLocaleString("ru-RU")}
                </span>
              </div>
              {e.note ? (
                <p className="text-sm text-muted-foreground">{e.note}</p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
