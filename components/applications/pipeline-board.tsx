"use client"

import { useState } from "react"

import { ApplicationCard } from "./application-card"
import type { ApplicationItem, InterviewItem, Stage } from "./types"

function Column({
  stage,
  apps,
  nextEventByApp,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  stage: Stage
  apps: ApplicationItem[]
  nextEventByApp: Map<string, InterviewItem>
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDrop: (stageId: string) => void
}) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(stage.id)
      }}
      className="flex min-w-[85%] snap-center flex-col gap-2 rounded-xl border border-border/60 bg-muted/30 p-2 sm:min-w-60 sm:flex-1 sm:snap-start"
    >
      <div className="flex items-center gap-2 px-1 py-1">
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: stage.color }}
        />
        <span className="text-sm font-medium">{stage.name}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {apps.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {apps.map((app) => (
          <ApplicationCard
            key={app.id}
            app={app}
            nextEvent={nextEventByApp.get(app.id) ?? null}
            draggable
            onDragStart={() => onDragStart(app.id)}
            onDragEnd={onDragEnd}
          />
        ))}
        {apps.length === 0 ? (
          <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground/60">
            Пусто
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function PipelineBoard({
  stages,
  apps,
  interviews,
  onMove,
}: {
  stages: Stage[]
  apps: ApplicationItem[]
  interviews: InterviewItem[]
  onMove: (appId: string, stageId: string) => Promise<void> | void
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const now = Date.now()
  const nextEventByApp = new Map<string, InterviewItem>()
  for (const iv of interviews) {
    if (iv.status !== "scheduled") continue
    if (new Date(iv.scheduledAt).getTime() < now) continue
    const current = nextEventByApp.get(iv.applicationId)
    if (!current || new Date(iv.scheduledAt).getTime() < new Date(current.scheduledAt).getTime()) {
      nextEventByApp.set(iv.applicationId, iv)
    }
  }

  const active = stages.filter((s) => s.type !== "terminal")
  const terminal = stages.filter((s) => s.type === "terminal")

  const byStage = new Map<string, ApplicationItem[]>()
  for (const app of apps) {
    const list = byStage.get(app.stageId) ?? []
    list.push(app)
    byStage.set(app.stageId, list)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 sm:snap-none">
        {active.map((stage) => (
          <Column
            key={stage.id}
            stage={stage}
            apps={byStage.get(stage.id) ?? []}
            nextEventByApp={nextEventByApp}
            onDragStart={setDraggingId}
            onDragEnd={() => setDraggingId(null)}
            onDrop={(stageId) => {
              if (draggingId) onMove(draggingId, stageId)
              setDraggingId(null)
            }}
          />
        ))}
      </div>

      {terminal.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            Завершённые
          </p>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 sm:snap-none">
            {terminal.map((stage) => (
              <Column
                key={stage.id}
                stage={stage}
                apps={byStage.get(stage.id) ?? []}
                nextEventByApp={nextEventByApp}
                onDragStart={setDraggingId}
                onDragEnd={() => setDraggingId(null)}
                onDrop={(stageId) => {
                  if (draggingId) onMove(draggingId, stageId)
                  setDraggingId(null)
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
