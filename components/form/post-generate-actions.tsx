"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Briefcase, Building2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface VacancyRef {
  source: "text" | "url"
  text?: string
  url?: string
}

interface VacancyMeta {
  company?: string
  role?: string
  country?: string
  salaryMin?: number
  salaryMax?: number
  currency?: string
}

function toNumber(v: string): number | null {
  if (!v.trim()) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function PostGenerateActions({ vacancy }: { vacancy?: VacancyRef }) {
  const { status } = useSession()
  const router = useRouter()
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [country, setCountry] = useState("")
  const [salaryMin, setSalaryMin] = useState("")
  const [salaryMax, setSalaryMax] = useState("")
  const [currency, setCurrency] = useState("")
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState<"" | "application" | "vacancy" | "both">("")
  const [error, setError] = useState<string | null>(null)

  const hasVacancy = Boolean(vacancy?.text?.trim() || vacancy?.url?.trim())

  useEffect(() => {
    if (status !== "authenticated" || !hasVacancy) return
    let cancelled = false
    setParsing(true)
    fetch("/api/vacancies/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: vacancy?.text, url: vacancy?.url }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { meta?: VacancyMeta } | null) => {
        if (cancelled || !data?.meta) return
        if (data.meta.company) setCompany(data.meta.company)
        if (data.meta.role) setRole(data.meta.role)
        if (data.meta.country) setCountry(data.meta.country)
        if (data.meta.salaryMin != null) setSalaryMin(String(data.meta.salaryMin))
        if (data.meta.salaryMax != null) setSalaryMax(String(data.meta.salaryMax))
        if (data.meta.currency) setCurrency(data.meta.currency)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setParsing(false)
      })
    return () => {
      cancelled = true
    }
  }, [status, hasVacancy, vacancy?.text, vacancy?.url])

  if (status === "loading") {
    return null
  }

  if (status !== "authenticated") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 px-6 py-5 text-center">
          <p className="text-sm text-muted-foreground">
            Зарегистрируйтесь, чтобы сохранить отклик и вести вакансию по воронке
            от отклика до офера.
          </p>
          <Button asChild size="sm">
            <Link href="/register">Создать аккаунт</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const vacancyText =
    vacancy?.source === "text" ? (vacancy.text ?? "").trim() : ""
  const sourceUrl = vacancy?.source === "url" ? (vacancy.url ?? "").trim() : ""

  async function create(target: "application" | "vacancy" | "both") {
    if (!company.trim() || !role.trim()) {
      setError("Укажите компанию и должность")
      return
    }
    setSaving(target)
    setError(null)
    try {
      if (target === "application") {
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company: company.trim(),
            role: role.trim(),
            country: country.trim() || null,
            salaryMin: toNumber(salaryMin),
            salaryMax: toNumber(salaryMax),
            currency: currency.trim() || null,
            sourceUrl: sourceUrl || null,
            vacancyText: vacancyText || null,
          }),
        })
        const d = (await res.json()) as {
          application?: { id: string }
          error?: string
        }
        if (!res.ok) throw new Error(d.error ?? "Не удалось создать отклик")
        toast.success("Отклик создан")
        router.push(`/applications/${d.application?.id}`)
      } else {
        const res = await fetch("/api/vacancies/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company: company.trim(),
            role: role.trim(),
            country: country.trim() || null,
            salaryMin: toNumber(salaryMin),
            salaryMax: toNumber(salaryMax),
            currency: currency.trim() || null,
            sourceUrl: sourceUrl || null,
            description: vacancyText || undefined,
            apply: target === "both",
          }),
        })
        const d = (await res.json()) as {
          vacancy?: { id: string }
          applicationId?: string | null
          error?: string
        }
        if (!res.ok) throw new Error(d.error ?? "Не удалось создать вакансию")
        toast.success(
          target === "both" ? "Вакансия и отклик созданы" : "Вакансия создана"
        )
        if (d.applicationId) router.push(`/applications/${d.applicationId}`)
        else if (d.vacancy?.id) router.push(`/vacancies/${d.vacancy.id}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить")
    } finally {
      setSaving("")
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 px-6 py-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h3 className="text-sm font-medium">Готово! Добавить в трекер?</h3>
        </div>

        {hasVacancy ? (
          <p className="text-xs text-muted-foreground">
            Мы подтянули данные из вакансии — проверьте и при необходимости
            поправьте.
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Компания *</Label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Название компании"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Должность *</Label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Senior Frontend Developer"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Страна / город</Label>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Удалённо"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label>ЗП от</Label>
              <Input
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="3000"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>до</Label>
              <Input
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="5000"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Валюта</Label>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="USD"
              />
            </div>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => create("application")}
            disabled={saving !== "" || parsing}
          >
            <Briefcase />
            {saving === "application" ? "Создаём…" : "Отклик"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => create("vacancy")}
            disabled={saving !== "" || parsing}
          >
            <Building2 />
            {saving === "vacancy" ? "Создаём…" : "Вакансия"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => create("both")}
            disabled={saving !== "" || parsing}
          >
            {saving === "both" ? "Создаём…" : "Отклик + вакансия"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
