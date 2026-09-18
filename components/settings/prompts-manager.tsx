"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, Clipboard, Pencil, Plus, Trash } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { buildReferencePrompt, PROMPT_PLACEHOLDERS } from "@/lib/prompt"

interface PromptItem {
  id: string
  name: string
  content: string
  isDefault: boolean
  updatedAt: string
}

export function PromptsManager() {
  const [prompts, setPrompts] = useState<PromptItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cv-prompts")
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { prompts?: PromptItem[] }
      setPrompts(data.prompts ?? [])
    } catch {
      setError("Не удалось загрузить промты")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function startCreate() {
    setEditingId(null)
    setName("")
    setContent("")
  }

  function startEdit(p: PromptItem) {
    setEditingId(p.id)
    setName(p.name)
    setContent(p.content)
  }

  function cancelEdit() {
    setEditingId(null)
    setName("")
    setContent("")
  }

  async function submit() {
    if (!name.trim() || !content.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(editingId ? `/api/cv-prompts/${editingId}` : "/api/cv-prompts", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), content: content.trim() }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось сохранить промт")
      }
      cancelEdit()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить промт")
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    await fetch(`/api/cv-prompts/${id}`, { method: "DELETE" })
    await load()
  }

  async function setDefault(id: string) {
    await fetch(`/api/cv-prompts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    })
    await load()
  }

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(buildReferencePrompt())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError("Не удалось скопировать — выделите текст вручную")
    }
  }

  async function copyPrompt(p: PromptItem) {
    try {
      await navigator.clipboard.writeText(p.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError("Не удалось скопировать — выделите текст вручную")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Промт для ChatGPT</CardTitle>
          <CardDescription>
            Скопируйте этот промт в обычный чат-бот (ChatGPT, Claude и т.п.),
            отредактируйте под себя, затем вставьте итоговый текст в поле
            «Свой промт» при генерации CV или сохраните его ниже.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea
            readOnly
            value={buildReferencePrompt()}
            className="min-h-64 font-mono text-xs"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyReference}>
              {copied ? <Check /> : <Clipboard />}
              {copied ? "Скопировано" : "Скопировать промт"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Доступные плейсхолдеры (платформа подставит данные формы):{" "}
            <span className="font-mono">{PROMPT_PLACEHOLDERS.join("  ")}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Изменить промт" : "Свой промт"}</CardTitle>
          <CardDescription>
            Собственные инструкции для LLM. Данные кандидата и строгая JSON-схема
            добавляются платформой автоматически.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Название</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Напр. Лаконичный senior-стиль"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Текст промта</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-40 font-mono text-xs"
              placeholder="Напиши CV в стиле…"
            />
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex gap-2">
            <Button onClick={submit} disabled={saving || !name.trim() || !content.trim()}>
              <Plus /> {editingId ? "Сохранить" : "Сохранить промт"}
            </Button>
            {editingId ? (
              <Button variant="ghost" onClick={cancelEdit}>
                Отмена
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-medium">Сохранённые промты</h2>
          {!editingId ? (
            <Button variant="outline" size="sm" onClick={startCreate}>
              <Plus /> Новый
            </Button>
          ) : null}
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : prompts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Промтов пока нет. Сохраните свой или используйте референсный выше.
          </p>
        ) : (
          prompts.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-xl border border-border/60 p-4"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{p.name}</span>
                {p.isDefault ? <Badge>По умолчанию</Badge> : null}
              </div>
              <p className="line-clamp-3 whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                {p.content}
              </p>
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="secondary" onClick={() => startEdit(p)}>
                  <Pencil /> Редактировать
                </Button>
                <Button size="sm" variant="ghost" onClick={() => copyPrompt(p)}>
                  <Clipboard /> Копировать
                </Button>
                {!p.isDefault ? (
                  <Button size="sm" variant="ghost" onClick={() => setDefault(p.id)}>
                    По умолчанию
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => remove(p.id)}
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
