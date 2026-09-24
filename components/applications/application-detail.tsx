"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Download,
  Trash,
  Wand,
  X,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

import { Generator } from "@/components/generator"
import { formatRelative, salaryRange } from "@/lib/format"
import { ActivityTimeline } from "./activity-timeline"
import { CompanyLogo } from "./company-logo"
import { ContactPicker } from "./contact-picker"
import { CvImport } from "./cv-import"
import { InterviewDialog } from "./interview-dialog"
import { ResponseDialog } from "./response-dialog"
import { SendDialog } from "./send-dialog"
import { StageBadge } from "./stage-badge"
import {
  INTERVIEW_LABELS,
  type ApplicationItem,
  type ContactItem,
  type InterviewItem,
  type Stage,
} from "./types"

const SOURCES = [
  "hh.ru",
  "LinkedIn",
  "Telegram",
  "Wellfound",
  "GitHub Jobs",
  "Реферал",
  "Другое",
]

function NotesCard({
  initial,
  onSave,
}: {
  initial: string
  onSave: (value: string) => Promise<void> | void
}) {
  const [value, setValue] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const dirty = value !== initial

  async function save() {
    setSaving(true)
    try {
      await onSave(value)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Заметки</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setSaved(false)
          }}
          placeholder="Договорённости, детали, что ответили…"
          className="min-h-32"
        />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={save} disabled={saving || !dirty}>
            {saving ? "Сохраняем…" : "Сохранить"}
          </Button>
          {saved && !dirty ? (
            <span className="text-xs text-muted-foreground">Сохранено</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function ApplicationDetail({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const [app, setApp] = useState<ApplicationItem | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [interviews, setInterviews] = useState<InterviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [hasTeam, setHasTeam] = useState(false)

  const load = useCallback(async () => {
    const [appRes, stagesRes, contactsRes, interviewsRes, teamRes] =
      await Promise.all([
        fetch(`/api/applications/${applicationId}`),
        fetch("/api/stages"),
        fetch("/api/contacts"),
        fetch(`/api/interviews?applicationId=${applicationId}`),
        fetch("/api/teams"),
      ])
    if (!appRes.ok) {
      setError("Отклик не найден")
      setLoading(false)
      return
    }
    const appData = (await appRes.json()) as { application: ApplicationItem }
    setApp(appData.application)
    if (stagesRes.ok) {
      const d = (await stagesRes.json()) as { stages: Stage[] }
      setStages(d.stages)
    }
    if (contactsRes.ok) {
      const d = (await contactsRes.json()) as { contacts: ContactItem[] }
      setContacts(d.contacts)
    }
    if (interviewsRes.ok) {
      const d = (await interviewsRes.json()) as { interviews: InterviewItem[] }
      setInterviews(d.interviews)
    }
    if (teamRes.ok) {
      const d = (await teamRes.json()) as { teams: unknown[] }
      setHasTeam(d.teams.length > 0)
    }
    setLoading(false)
  }, [applicationId])

  useEffect(() => {
    load()
  }, [load])

  async function patch(payload: Record<string, unknown>) {
    setError(null)
    const res = await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string }
      setError(d?.error ?? "Не удалось сохранить")
      return
    }
    const d = (await res.json()) as { application: ApplicationItem }
    setApp(d.application)
  }

  async function remove() {
    await fetch(`/api/applications/${applicationId}`, { method: "DELETE" })
    router.push("/applications")
  }

  async function toggleContact(contactId: string) {
    const current = app?.contactIds ?? []
    const next = current.includes(contactId)
      ? current.filter((id) => id !== contactId)
      : [...current, contactId]
    await patch({ contactIds: next })
  }

  async function createContact(data: {
    name: string
    email?: string
    phone?: string
    telegram?: string
    linkedin?: string
    company?: string
    role?: string
  }): Promise<ContactItem | null> {
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) return null
    const d = (await res.json()) as { contact: ContactItem }
    setContacts((prev) => [...prev, d.contact])
    return d.contact
  }

  async function updateInterviewStatus(id: string, status: string) {
    await fetch(`/api/interviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    await load()
  }

  async function deleteInterview(id: string) {
    await fetch(`/api/interviews/${id}`, { method: "DELETE" })
    await load()
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
  const appInterviews = interviews.filter((iv) => iv.applicationId === app.id)
  const upcoming = appInterviews
    .filter((iv) => iv.status === "scheduled")
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )
  const isOfferStage =
    currentStage?.name === "Офер" || currentStage?.terminalResult === "accepted"
  const salary = salaryRange(app.salaryMin, app.salaryMax, app.currency)

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
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <CompanyLogo
                domain={app.companyDomain}
                name={app.company}
                size="lg"
              />
              <div>
                <h1 className="font-heading text-xl font-medium">{app.role}</h1>
                <p className="text-sm text-muted-foreground">{app.company}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {currentStage ? <StageBadge stage={currentStage} /> : null}
                  {salary ? (
                    <span className="text-sm text-muted-foreground">
                      {salary}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={app.stageId}
                onValueChange={(v) => patch({ stageId: v })}
              >
                <SelectTrigger className="w-44">
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
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-2">
            <SendDialog
              applicationId={app.id}
              stages={stages}
              onSaved={load}
            />
            <ResponseDialog
              applicationId={app.id}
              stages={stages}
              onSaved={load}
            />
            <InterviewDialog
              applicationId={app.id}
              onCreated={load}
            />
          </div>

          {app.sentAt ? (
            <p className="text-xs text-muted-foreground">
              Отправлено: {app.sentChannel ?? "—"}
              {app.sentTo ? ` → ${app.sentTo}` : ""} ·{" "}
              {new Date(app.sentAt).toLocaleString("ru-RU")}
            </p>
          ) : null}
          {upcoming.length > 0 ? (
            <p className="text-xs text-primary">
              Ближайшее: {INTERVIEW_LABELS[upcoming[0].type]} ·{" "}
              {formatRelative(upcoming[0].scheduledAt)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="max-w-full justify-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="timeline">Таймлайн</TabsTrigger>
          <TabsTrigger value="contacts">Контакты</TabsTrigger>
          <TabsTrigger value="events">События</TabsTrigger>
          <TabsTrigger value="notes">Заметки</TabsTrigger>
          <TabsTrigger value="cv">CV</TabsTrigger>
          <TabsTrigger value="team">Команда</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
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
                  <Label>Источник</Label>
                  <Select
                    value={app.sourceType ?? ""}
                    onValueChange={(v) => patch({ sourceType: v || null })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Где нашли вакансию" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Ссылка на вакансию</Label>
                  <Input
                    defaultValue={app.sourceUrl ?? ""}
                    placeholder="https://…"
                    onBlur={(e) => {
                      if (e.target.value !== (app.sourceUrl ?? "")) {
                        patch({ sourceUrl: e.target.value || null })
                      }
                    }}
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>ЗП от</Label>
                    <Input
                      defaultValue={app.salaryMin != null ? String(app.salaryMin) : ""}
                      onBlur={(e) =>
                        patch({
                          salaryMin: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>до</Label>
                    <Input
                      defaultValue={app.salaryMax != null ? String(app.salaryMax) : ""}
                      onBlur={(e) =>
                        patch({
                          salaryMax: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Валюта</Label>
                    <Input
                      defaultValue={app.currency ?? ""}
                      onBlur={(e) =>
                        patch({ currency: e.target.value || null })
                      }
                    />
                  </div>
                </div>
              </div>

              {isOfferStage ? (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium">Офер</h3>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label>ЗП</Label>
                        <Input
                          key={app.offerSalary ?? ""}
                          defaultValue={
                            app.offerSalary != null ? String(app.offerSalary) : ""
                          }
                          placeholder="5000"
                          onBlur={(e) =>
                            patch({
                              offerSalary: e.target.value
                                ? Number(e.target.value)
                                : null,
                            })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Валюта</Label>
                        <Input
                          key={app.offerCurrency ?? ""}
                          defaultValue={app.offerCurrency ?? ""}
                          placeholder="USD"
                          onBlur={(e) =>
                            patch({ offerCurrency: e.target.value || null })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Бенефиты</Label>
                        <Input
                          key={app.offerBenefits ?? ""}
                          defaultValue={app.offerBenefits ?? ""}
                          placeholder="страховка, отпуск…"
                          onBlur={(e) =>
                            patch({ offerBenefits: e.target.value || null })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Формат</Label>
                        <Input
                          key={app.offerRemote ?? ""}
                          defaultValue={app.offerRemote ?? ""}
                          placeholder="remote / hybrid / office"
                          onBlur={(e) =>
                            patch({ offerRemote: e.target.value || null })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <ActivityTimeline timeline={app.timeline} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <ContactPicker
                contacts={contacts}
                selectedIds={app.contactIds}
                onToggle={toggleContact}
                onCreate={createContact}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="pt-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <InterviewDialog applicationId={app.id} onCreated={load} />
              {appInterviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Событий нет. Назначьте созвон или собеседование.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {appInterviews
                    .sort(
                      (a, b) =>
                        new Date(b.scheduledAt).getTime() -
                        new Date(a.scheduledAt).getTime()
                    )
                    .map((iv) => (
                      <div
                        key={iv.id}
                        className="flex items-center gap-3 rounded-xl border border-border/60 p-3"
                      >
                        <CalendarClock className="size-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {INTERVIEW_LABELS[iv.type]}
                            {iv.channel ? ` · ${iv.channel}` : ""}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {new Date(iv.scheduledAt).toLocaleString("ru-RU")}
                            {iv.note ? ` · ${iv.note}` : ""}
                          </p>
                        </div>
                        {iv.status === "scheduled" ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Завершено"
                              onClick={() => updateInterviewStatus(iv.id, "done")}
                            >
                              <Check />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Отменено"
                              onClick={() => updateInterviewStatus(iv.id, "cancelled")}
                            >
                              <X />
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="secondary">{iv.status}</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground"
                          onClick={() => deleteInterview(iv.id)}
                        >
                          <Trash />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="pt-4">
          <NotesCard
            initial={app.notes ?? ""}
            onSave={(v) => patch({ notes: v })}
          />
        </TabsContent>

        <TabsContent value="cv" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">CV</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {app.cvId ? (
                <Button asChild variant="outline" className="w-fit">
                  <a href={`/api/generated-cvs/${app.cvId}/download`} download>
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

              <CvImport applicationId={app.id} onImported={load} />

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
                    vacancyText={app.vacancyText ?? undefined}
                    generateExtras={{ save: true, applicationId: app.id }}
                    showVacancyEntry={false}
                    onGenerated={() => {
                      setGenerating(false)
                      load()
                    }}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="pt-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              {!hasTeam ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    У вас пока нет команды. Создайте её, чтобы делиться этим
                    откликом и опытом собеседований с друзьями.
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-fit">
                    <Link href="/teams">Создать команду</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                      <Label>Поделиться с командой</Label>
                      <p className="text-xs text-muted-foreground">
                        Отклик появится в доске вакансий команды.
                      </p>
                    </div>
                    <Switch
                      checked={app.visibility === "team"}
                      onCheckedChange={(v) =>
                        patch({ visibility: v ? "team" : "private" })
                      }
                    />
                  </div>

                  {app.visibility === "team" ? (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                          <Label>Показывать зарплату</Label>
                          <p className="text-xs text-muted-foreground">
                            Вилка и офер будут видны команде.
                          </p>
                        </div>
                        <Switch
                          checked={app.shareSalary}
                          onCheckedChange={(v) => patch({ shareSalary: v })}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                          <Label>Показывать заметки</Label>
                          <p className="text-xs text-muted-foreground">
                            Ваши личные заметки будут видны команде.
                          </p>
                        </div>
                        <Switch
                          checked={app.shareNotes}
                          onCheckedChange={(v) => patch({ shareNotes: v })}
                        />
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
