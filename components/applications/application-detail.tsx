"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Trash, Wand } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

import { Generator } from "@/components/generator"

import type { CvFormValues } from "@/lib/schemas"

interface Stage {
  id: string
  name: string
  color: string
  type: string
  terminalResult: string | null
}

interface TimelineEvent {
  at: string
  stageName: string
  note?: string
}

interface FullApp {
  id: string
  company: string
  role: string
  country: string | null
  salaryMin: number | null
  salaryMax: number | null
  currency: string | null
  sourceType: string | null
  sourceUrl: string | null
  vacancyText: string | null
  cvId: string | null
  stageId: string
  timeline: TimelineEvent[]
  notes: string | null
  contactName: string | null
  contactEmail: string | null
  sentAt: string | null
  offerSalary: number | null
  offerCurrency: string | null
  offerBenefits: string | null
  offerRemote: string | null
}

interface ProfileItem {
  id: string
  label: string
  isDefault: boolean
  data: CvFormValues
}

export function ApplicationDetail({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const [app, setApp] = useState<FullApp | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [profiles, setProfiles] = useState<ProfileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const load = useCallback(async () => {
    const [appRes, stagesRes, profilesRes] = await Promise.all([
      fetch(`/api/applications/${applicationId}`),
      fetch("/api/stages"),
      fetch("/api/profiles"),
    ])
    if (!appRes.ok) {
      setError("Отклик не найден")
      setLoading(false)
      return
    }
    const appData = (await appRes.json()) as { application: FullApp }
    setApp(appData.application)
    if (stagesRes.ok) {
      const d = (await stagesRes.json()) as { stages: Stage[] }
      setStages(d.stages)
    }
    if (profilesRes.ok) {
      const d = (await profilesRes.json()) as { profiles: ProfileItem[] }
      setProfiles(d.profiles)
    }
    setLoading(false)
  }, [applicationId])

  useEffect(() => {
    load()
  }, [load])

  async function patch(payload: Record<string, unknown>) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось сохранить")
      }
      const d = (await res.json()) as { application: FullApp }
      setApp(d.application)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить")
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    await fetch(`/api/applications/${applicationId}`, { method: "DELETE" })
    router.push("/applications")
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  if (!app) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error ?? "Отклик не найден"}</AlertDescription>
      </Alert>
    )
  }

  const currentStage = stages.find((s) => s.id === app.stageId)
  const defaultProfile =
    profiles.find((p) => p.isDefault) ?? profiles[0] ?? null
  const isOfferStage =
    currentStage?.name === "Офер" || currentStage?.terminalResult === "accepted"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/applications">
            <ArrowLeft /> Отклики
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive"
          onClick={remove}
        >
          <Trash />
          <span className="sr-only">Удалить</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{app.role}</CardTitle>
          <p className="text-sm text-muted-foreground">{app.company}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Этап</Label>
              <Select
                value={app.stageId}
                onValueChange={(v) => patch({ stageId: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Страна / город</Label>
              <Input
                defaultValue={app.country ?? ""}
                onBlur={(e) => {
                  if (e.target.value !== (app.country ?? "")) {
                    patch({ country: e.target.value || null })
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Контакт</Label>
              <Input
                defaultValue={app.contactName ?? ""}
                placeholder="Имя контакта"
                onBlur={(e) => {
                  if (e.target.value !== (app.contactName ?? "")) {
                    patch({ contactName: e.target.value || null })
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email контакта</Label>
              <Input
                defaultValue={app.contactEmail ?? ""}
                placeholder="email@company.com"
                onBlur={(e) => {
                  if (e.target.value !== (app.contactEmail ?? "")) {
                    patch({ contactEmail: e.target.value || null })
                  }
                }}
              />
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium">История этапов</h3>
            <ol className="mt-2 flex flex-col gap-1.5">
              {app.timeline.map((t, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <span className="size-1.5 rounded-full bg-muted-foreground" />
                  <span>{t.stageName}</span>
                  <span className="ml-auto text-xs">
                    {new Date(t.at).toLocaleString("ru-RU")}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Заметки</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Textarea
            key={app.notes ?? ""}
            defaultValue={app.notes ?? ""}
            placeholder="Договорённости, детали, что ответили…"
            onBlur={(e) => {
              if (e.target.value !== (app.notes ?? "")) {
                patch({ notes: e.target.value })
              }
            }}
          />
        </CardContent>
      </Card>

      {isOfferStage ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Офер</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>ЗП</Label>
              <Input
                key={app.offerSalary ?? ""}
                defaultValue={app.offerSalary != null ? String(app.offerSalary) : ""}
                placeholder="5000"
                onBlur={(e) =>
                  patch({ offerSalary: e.target.value ? Number(e.target.value) : null })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Валюта</Label>
              <Input
                key={app.offerCurrency ?? ""}
                defaultValue={app.offerCurrency ?? ""}
                placeholder="USD"
                onBlur={(e) => patch({ offerCurrency: e.target.value || null })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Бенефиты</Label>
              <Input
                key={app.offerBenefits ?? ""}
                defaultValue={app.offerBenefits ?? ""}
                placeholder="страховка, отпуск…"
                onBlur={(e) => patch({ offerBenefits: e.target.value || null })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Формат</Label>
              <Input
                key={app.offerRemote ?? ""}
                defaultValue={app.offerRemote ?? ""}
                placeholder="remote / hybrid / office"
                onBlur={(e) => patch({ offerRemote: e.target.value || null })}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">CV</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {app.cvId ? (
            <Button asChild variant="outline" className="w-fit">
              <a
                href={`/api/generated-cvs/${app.cvId}/download`}
                download
              >
                <Download /> Скачать CV
              </a>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              CV для этого отклика ещё не сгенерировано.
            </p>
          )}

          {!generating ? (
            <Button
              variant="secondary"
              className="w-fit"
              onClick={() => setGenerating(true)}
            >
              <Wand /> Сгенерировать CV под вакансию
            </Button>
          ) : null}

          {generating ? (
            <div className="flex flex-col gap-3 rounded-xl border border-border/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Генерация CV</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setGenerating(false)
                    load()
                  }}
                >
                  Скрыть
                </Button>
              </div>
              <Generator
                initialValues={defaultProfile?.data}
                vacancyText={app.vacancyText ?? undefined}
                generateExtras={{ save: true, applicationId: app.id }}
                onGenerated={() => {
                  setGenerating(false)
                  load()
                }}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {saving ? (
        <p className="text-xs text-muted-foreground">Сохранение…</p>
      ) : null}
    </div>
  )
}
