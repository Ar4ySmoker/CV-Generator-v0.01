"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const SOURCES = [
  "hh.ru",
  "LinkedIn",
  "Telegram",
  "Wellfound",
  "GitHub Jobs",
  "Реферал",
  "Другое",
]

function toNumber(v: string): number | null {
  if (!v.trim()) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function ApplicationForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    company: "",
    role: "",
    country: "",
    salaryMin: "",
    salaryMax: "",
    currency: "",
    sourceType: "",
    sourceUrl: "",
    vacancyText: "",
  })

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit() {
    if (!form.company.trim() || !form.role.trim()) {
      setError("Укажите компанию и должность")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: form.company.trim(),
          role: form.role.trim(),
          country: form.country.trim() || null,
          salaryMin: toNumber(form.salaryMin),
          salaryMax: toNumber(form.salaryMax),
          currency: form.currency.trim() || null,
          sourceType: form.sourceType || null,
          sourceUrl: form.sourceUrl.trim() || null,
          vacancyText: form.vacancyText.trim() || null,
        }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось создать отклик")
      }
      const d = (await res.json()) as { application: { id: string } }
      router.push(`/applications/${d.application.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать отклик")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Компания *</Label>
          <Input
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            placeholder="Название компании"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Должность *</Label>
          <Input
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
            placeholder="Senior Frontend Developer"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Страна / город</Label>
          <Input
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
            placeholder="США, удалённо"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Источник</Label>
          <Select
            value={form.sourceType}
            onValueChange={(v) => set("sourceType", v)}
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
            value={form.sourceUrl}
            onChange={(e) => set("sourceUrl", e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1.5">
            <Label>ЗП от</Label>
            <Input
              value={form.salaryMin}
              onChange={(e) => set("salaryMin", e.target.value)}
              placeholder="3000"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>до</Label>
            <Input
              value={form.salaryMax}
              onChange={(e) => set("salaryMax", e.target.value)}
              placeholder="5000"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Валюта</Label>
            <Input
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
              placeholder="USD"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Текст вакансии</Label>
        <Textarea
          className="min-h-32"
          value={form.vacancyText}
          onChange={(e) => set("vacancyText", e.target.value)}
          placeholder="Вставьте описание вакансии — по нему CV адаптируется"
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button onClick={submit} disabled={loading} className="w-fit">
        {loading ? "Создаём…" : "Создать отклик"}
      </Button>
    </div>
  )
}
