"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bookmark,
  BriefcaseBusiness,
  Building2,
  Check,
  ExternalLink,
  Plus,
  Search,
  Send,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

import { salaryRange } from "@/lib/format"

import type { VacancyItem, VacancyStatusValue } from "./types"

const STATUS_LABEL: Record<VacancyStatusValue, string> = {
  saved: "Сохранена",
  applied: "Подался",
  skipped: "Пропустить",
}

function AddVacancyDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onAdded: () => void
}) {
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [sourceUrl, setSourceUrl] = useState("")
  const [country, setCountry] = useState("")
  const [salaryMin, setSalaryMin] = useState("")
  const [salaryMax, setSalaryMax] = useState("")
  const [currency, setCurrency] = useState("")
  const [tags, setTags] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  function reset() {
    setCompany("")
    setRole("")
    setSourceUrl("")
    setCountry("")
    setSalaryMin("")
    setSalaryMax("")
    setCurrency("")
    setTags("")
    setDescription("")
  }

  async function submit() {
    if (!company.trim() || !role.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/vacancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: company.trim(),
          role: role.trim(),
          country: country.trim() || undefined,
          salaryMin: salaryMin.trim() ? Number(salaryMin) : null,
          salaryMax: salaryMax.trim() ? Number(salaryMax) : null,
          currency: currency.trim() || undefined,
          sourceUrl: sourceUrl.trim() || undefined,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          description: description.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось добавить")
      }
      toast.success("Вакансия добавлена")
      reset()
      onOpenChange(false)
      onAdded()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось добавить")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить вакансию</DialogTitle>
          <DialogDescription>
            Укажите ссылку — текст вакансии подтянется автоматически.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Компания *</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Яндекс" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Должность *</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Frontend Developer" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Ссылка</Label>
            <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://hh.ru/vacancy/…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Страна / город</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Теги (через запятую)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="React, Remote" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:col-span-2">
            <div className="flex flex-col gap-1.5">
              <Label>ЗП от</Label>
              <Input value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} inputMode="numeric" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>до</Label>
              <Input value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} inputMode="numeric" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Валюта</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Описание (если нет ссылки)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-20" placeholder="Обязанности, требования…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={submit} disabled={saving || !company.trim() || !role.trim()}>
            {saving ? "Добавляем…" : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function VacancyCard({
  vacancy,
  onChanged,
}: {
  vacancy: VacancyItem
  onChanged: () => void
}) {
  const router = useRouter()

  async function setStatus(status: VacancyStatusValue) {
    const res = await fetch(`/api/vacancies/${vacancy.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success(status === "skipped" ? "Пропущено" : "Сохранено")
      onChanged()
    } else {
      toast.error("Не удалось сохранить")
    }
  }

  async function apply() {
    const res = await fetch(`/api/vacancies/${vacancy.id}/apply`, {
      method: "POST",
    })
    if (res.ok) {
      const d = (await res.json()) as { applicationId: string }
      toast.success("Отклик создан")
      router.push(`/applications/${d.applicationId}`)
    } else {
      const d = (await res.json().catch(() => ({}))) as { error?: string }
      toast.error(d?.error ?? "Не удалось создать отклик")
    }
  }

  const salary = salaryRange(vacancy.salaryMin, vacancy.salaryMax, vacancy.currency)

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Building2 className="size-4 text-primary" />
          <span className="font-medium">{vacancy.company}</span>
          <span className="text-sm text-muted-foreground">{vacancy.role}</span>
          <span className="ml-auto flex flex-wrap gap-1.5">
            {vacancy.source === "shared" && vacancy.teamName ? (
              <Badge variant="secondary">Команда: {vacancy.teamName}</Badge>
            ) : vacancy.source === "shared" ? (
              <Badge variant="secondary">Расшарено</Badge>
            ) : null}
            {vacancy.status ? (
              <Badge variant={vacancy.status === "applied" ? "default" : "outline"}>
                {STATUS_LABEL[vacancy.status]}
              </Badge>
            ) : null}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {salary ? <span>{salary}</span> : null}
          {vacancy.country ? <span>{vacancy.country}</span> : null}
          {vacancy.tags.map((t) => (
            <Badge key={t} variant="secondary" className="text-xs">
              {t}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {vacancy.status === "applied" && vacancy.applicationId ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/applications/${vacancy.applicationId}`}>
                <Check /> Открыть отклик
              </Link>
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={apply}>
                <Send /> Податься
              </Button>
              {vacancy.status !== "saved" ? (
                <Button size="sm" variant="outline" onClick={() => setStatus("saved")}>
                  <Bookmark /> Сохранить
                </Button>
              ) : null}
              {vacancy.status !== "skipped" ? (
                <Button size="sm" variant="ghost" onClick={() => setStatus("skipped")}>
                  <X /> Пропустить
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setStatus("saved")}>
                  <Bookmark /> Вернуть
                </Button>
              )}
            </>
          )}
          {vacancy.sourceUrl ? (
            <a
              href={vacancy.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-3.5" /> Источник
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function VacanciesBoard() {
  const [vacancies, setVacancies] = useState<VacancyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("all")
  const [q, setQ] = useState("")
  const [addOpen, setAddOpen] = useState(false)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    if (status !== "all") params.set("status", status)
    const res = await fetch(`/api/vacancies?${params.toString()}`)
    if (res.ok) {
      const d = (await res.json()) as { vacancies: VacancyItem[] }
      setVacancies(d.vacancies)
    }
    setLoading(false)
  }, [q, status])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={status} onValueChange={setStatus} className="w-full sm:w-auto">
          <TabsList className="max-w-full justify-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="saved">Сохранённые</TabsTrigger>
            <TabsTrigger value="applied">Подался</TabsTrigger>
            <TabsTrigger value="skipped">Пропустил</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus /> Вакансию
        </Button>
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Поиск по компании или роли"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : vacancies.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 py-12 text-center">
          <BriefcaseBusiness className="size-8 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Вакансий не найдено. Добавьте свою или попросите друзей расшарить
            командные.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {vacancies.map((v) => (
            <VacancyCard key={v.id} vacancy={v} onChanged={load} />
          ))}
        </div>
      )}

      <AddVacancyDialog open={addOpen} onOpenChange={setAddOpen} onAdded={load} />
    </div>
  )
}
