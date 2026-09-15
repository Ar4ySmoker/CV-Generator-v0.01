"use client"

import { useRouter } from "next/navigation"
import { CalendarClock, Clock } from "lucide-react"

import { formatRelative, salaryRange, timeInStage } from "@/lib/format"
import { cn } from "@/lib/utils"

import { CompanyLogo } from "./company-logo"
import type { ApplicationItem, InterviewItem } from "./types"

export function ApplicationCard({
  app,
  nextEvent,
  onDragStart,
  onDragEnd,
  draggable = false,
}: {
  app: ApplicationItem
  nextEvent?: InterviewItem | null
  onDragStart?: () => void
  onDragEnd?: () => void
  draggable?: boolean
}) {
  const router = useRouter()

  const salary = salaryRange(app.salaryMin, app.salaryMax, app.currency)
  const age = app.stageEnteredAt ? timeInStage(app.stageEnteredAt) : null

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return
        e.dataTransfer.effectAllowed = "move"
        onDragStart?.()
      }}
      onDragEnd={() => onDragEnd?.()}
      onClick={() => router.push(`/applications/${app.id}`)}
      className="flex cursor-pointer flex-col gap-2 rounded-xl border border-border/60 bg-card p-3 transition-shadow hover:shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-start gap-2.5">
        <CompanyLogo domain={app.companyDomain} name={app.company} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-snug">
            {app.role}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {app.company}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {age ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {age}
          </span>
        ) : null}
        {nextEvent ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
            <CalendarClock className="size-3" />
            {formatRelative(nextEvent.scheduledAt)}
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground",
          !app.country && !salary && !app.sentAt && "hidden"
        )}
      >
        {app.country ? <span>{app.country}</span> : null}
        {salary ? <span>{salary}</span> : null}
        {app.sentAt ? (
          <span>
            {app.sentChannel
              ? `${app.sentChannel} · ${new Date(app.sentAt).toLocaleDateString("ru-RU")}`
              : `Отправлено · ${new Date(app.sentAt).toLocaleDateString("ru-RU")}`}
          </span>
        ) : null}
      </div>
    </div>
  )
}
