"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowDown, ArrowUp, Plus, Trash } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface StageItem {
  id?: string
  name: string
  color: string
  type: "start" | "active" | "terminal"
  terminalResult: "rejected" | "no-response" | "accepted" | null
}

const TYPE_LABELS: Record<StageItem["type"], string> = {
  start: "Старт",
  active: "Активный",
  terminal: "Терминальный",
}

const RESULT_LABELS: Record<string, string> = {
  rejected: "Отклонено",
  "no-response": "Нет ответа",
  accepted: "Принято",
}

export function PipelineEditor() {
  const [stages, setStages] = useState<StageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch("/api/stages")
    if (res.ok) {
      const d = (await res.json()) as {
        stages: Array<StageItem & { terminalResult: string | null }>
      }
      setStages(
        d.stages.map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          type: s.type,
          terminalResult: s.terminalResult,
        }))
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function update(index: number, patch: Partial<StageItem>) {
    setSaved(false)
    setStages((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    )
  }

  function move(index: number, dir: -1 | 1) {
    setSaved(false)
    setStages((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      const tmp = next[index]
      next[index] = next[target]
      next[target] = tmp
      return next
    })
  }

  function add() {
    setSaved(false)
    setStages((prev) => [
      ...prev,
      { name: "", color: "#64748b", type: "active", terminalResult: null },
    ])
  }

  function remove(index: number) {
    setSaved(false)
    setStages((prev) => prev.filter((_, i) => i !== index))
  }

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch("/api/stages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stages: stages.map((s) => ({
            id: s.id,
            name: s.name,
            color: s.color,
            type: s.type,
            terminalResult: s.type === "terminal" ? s.terminalResult : null,
          })),
        }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось сохранить")
      }
      setSaved(true)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {stages.map((s, i) => (
          <div
            key={s.id ?? `new-${i}`}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 p-3"
          >
            <span className="w-6 text-center text-xs text-muted-foreground">
              {i + 1}
            </span>
            <input
              type="color"
              value={s.color}
              onChange={(e) => update(i, { color: e.target.value })}
              className="h-8 w-9 cursor-pointer rounded border border-input bg-transparent p-0.5"
              aria-label="Цвет этапа"
            />
            <Input
              className="min-w-40 flex-1"
              value={s.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Название этапа"
            />
            <div className="flex items-center gap-1.5">
              <Select
                value={s.type}
                onValueChange={(v) =>
                  update(i, { type: v as StageItem["type"] })
                }
              >
                <SelectTrigger size="sm" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABELS) as StageItem["type"][]).map(
                    (t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              {s.type === "terminal" ? (
                <Select
                  value={s.terminalResult ?? undefined}
                  onValueChange={(v) =>
                    update(i, { terminalResult: v as StageItem["terminalResult"] })
                  }
                >
                  <SelectTrigger size="sm" className="w-32">
                    <SelectValue placeholder="Результат" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RESULT_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => move(i, -1)}
                disabled={i === 0}
              >
                <ArrowUp />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => move(i, 1)}
                disabled={i === stages.length - 1}
              >
                <ArrowDown />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive"
                onClick={() => remove(i)}
              >
                <Trash />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={add}>
          <Plus /> Добавить этап
        </Button>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "Сохраняем…" : "Сохранить"}
        </Button>
      </div>

      {saved ? (
        <p className="text-sm text-primary">Сохранено</p>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Этапы показываются в порядке сверху вниз. Удалённый этап переносит свои
        отклики на этап «Старт».
      </p>
    </div>
  )
}
