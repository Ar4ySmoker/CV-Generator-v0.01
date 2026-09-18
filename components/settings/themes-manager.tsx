"use client"

import { useCallback, useEffect, useState } from "react"
import { Pencil, Plus, Trash } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { CvThemeStyle } from "@/lib/cv-templates"

const FONTS = ["Calibri", "Arial", "Times New Roman", "Georgia", "Verdana", "Tahoma", "Helvetica"]

const HEADING_LABELS: Record<CvThemeStyle["heading"], string> = {
  underline: "Подчёркнутый заголовок",
  bar: "Акцентная полоса",
  plain: "Без оформления",
}

interface ThemeItem extends CvThemeStyle {
  id: string
  name: string
  isDefault: boolean
  updatedAt: string
}

interface ThemeForm {
  name: string
  font: string
  accent: string
  body: string
  gray: string
  heading: CvThemeStyle["heading"]
  accentRule: boolean
}

function initialForm(): ThemeForm {
  return {
    name: "",
    font: "Calibri",
    accent: "1F3B63",
    body: "222222",
    gray: "595F66",
    heading: "underline",
    accentRule: false,
  }
}

function Preview({ theme }: { theme: ThemeForm }) {
  return (
    <div className="flex aspect-[3/4] w-full flex-col gap-1.5 rounded-md border border-border/40 bg-white p-2.5">
      <div
        className="h-2.5 w-4/5 rounded-[2px]"
        style={{ backgroundColor: `#${theme.accent}` }}
      />
      <div
        className="h-1.5 w-1/2 rounded-[2px]"
        style={{ backgroundColor: `#${theme.gray}` }}
      />
      <div className="mt-1 flex items-center gap-1">
        {theme.heading === "bar" ? (
          <div
            className="h-4 w-0.5 shrink-0 rounded-[1px]"
            style={{ backgroundColor: `#${theme.accent}` }}
          />
        ) : null}
        <div
          className="h-1.5 w-1/3 rounded-[2px]"
          style={{
            backgroundColor: theme.heading === "plain" ? `#${theme.gray}` : `#${theme.accent}`,
            boxShadow: theme.heading === "underline" ? `0 2px 0 #${theme.accent}` : undefined,
          }}
        />
      </div>
      <div className="h-1 w-full rounded-[2px]" style={{ backgroundColor: `#${theme.body}` }} />
      <div className="h-1 w-5/6 rounded-[2px]" style={{ backgroundColor: `#${theme.body}` }} />
      <div className="h-1 w-4/6 rounded-[2px]" style={{ backgroundColor: `#${theme.body}` }} />
      {theme.accentRule ? (
        <div className="mt-0.5 h-0.5 w-full rounded-[1px]" style={{ backgroundColor: `#${theme.accent}` }} />
      ) : null}
    </div>
  )
}

export function ThemesManager() {
  const [themes, setThemes] = useState<ThemeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ThemeForm>(initialForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cv-themes")
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { themes?: ThemeItem[] }
      setThemes(data.themes ?? [])
    } catch {
      setError("Не удалось загрузить темы")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function startCreate() {
    setEditingId(null)
    setForm(initialForm())
  }

  function startEdit(t: ThemeItem) {
    setEditingId(t.id)
    setForm({
      name: t.name,
      font: t.font,
      accent: t.accent,
      body: t.body,
      gray: t.gray,
      heading: t.heading,
      accentRule: t.accentRule,
    })
  }

  function patch(partial: Partial<ThemeForm>) {
    setForm((f) => ({ ...f, ...partial }))
  }

  async function submit() {
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(editingId ? `/api/cv-themes/${editingId}` : "/api/cv-themes", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, name: form.name.trim() }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось сохранить тему")
      }
      startCreate()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить тему")
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    await fetch(`/api/cv-themes/${id}`, { method: "DELETE" })
    await load()
  }

  async function setDefault(id: string) {
    await fetch(`/api/cv-themes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    })
    await load()
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Изменить тему" : "Новая тема оформления"}</CardTitle>
          <CardDescription>
            Создайте собственный дизайн CV — шрифт, цвета и стиль заголовков.
            Темы доступны при генерации CV.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-[1fr_200px]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Название</Label>
              <Input
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="Напр. Мой фирменный стиль"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Шрифт</Label>
              <Input
                list="font-options"
                value={form.font}
                onChange={(e) => patch({ font: e.target.value })}
              />
              <datalist id="font-options">
                {FONTS.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label>Акцент</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={`#${form.accent}`}
                    onChange={(e) => patch({ accent: e.target.value.replace(/^#/, "") })}
                    className="h-9 w-9 cursor-pointer rounded border border-border/60 bg-transparent"
                  />
                  <span className="font-mono text-xs">#{form.accent}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Текст</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={`#${form.body}`}
                    onChange={(e) => patch({ body: e.target.value.replace(/^#/, "") })}
                    className="h-9 w-9 cursor-pointer rounded border border-border/60 bg-transparent"
                  />
                  <span className="font-mono text-xs">#{form.body}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Вторичный</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={`#${form.gray}`}
                    onChange={(e) => patch({ gray: e.target.value.replace(/^#/, "") })}
                    className="h-9 w-9 cursor-pointer rounded border border-border/60 bg-transparent"
                  />
                  <span className="font-mono text-xs">#{form.gray}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Стиль заголовков</Label>
              <Select
                value={form.heading}
                onValueChange={(v) => patch({ heading: v as CvThemeStyle["heading"] })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(HEADING_LABELS) as CvThemeStyle["heading"][]).map((h) => (
                    <SelectItem key={h} value={h}>
                      {HEADING_LABELS[h]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.accentRule}
                onCheckedChange={(v) => patch({ accentRule: v === true })}
              />
              Акцентная линия под шапкой
            </label>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="flex gap-2">
              <Button onClick={submit} disabled={saving || !form.name.trim()}>
                <Plus /> {editingId ? "Сохранить" : "Сохранить тему"}
              </Button>
              {editingId ? (
                <Button variant="ghost" onClick={startCreate}>
                  Отмена
                </Button>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Предпросмотр</Label>
            <Preview theme={form} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-medium">Мои темы</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : themes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Тем пока нет. Создайте свою — она появится в выборе шаблона при генерации.
          </p>
        ) : (
          themes.map((t) => (
            <div
              key={t.id}
              className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="size-4 rounded-full border border-border/60" style={{ backgroundColor: `#${t.accent}` }} />
                  <span className="size-4 rounded-full border border-border/60" style={{ backgroundColor: `#${t.body}` }} />
                  <span className="size-4 rounded-full border border-border/60" style={{ backgroundColor: `#${t.gray}` }} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.name}</span>
                    {t.isDefault ? <Badge>По умолчанию</Badge> : null}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t.font} · {HEADING_LABELS[t.heading]}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => startEdit(t)}>
                  <Pencil /> Изменить
                </Button>
                {!t.isDefault ? (
                  <Button variant="ghost" size="sm" onClick={() => setDefault(t.id)}>
                    По умолчанию
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => remove(t.id)}
                >
                  <Trash /> Удалить
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
