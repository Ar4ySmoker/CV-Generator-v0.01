"use client"

import { useCallback, useEffect, useState } from "react"
import { LoaderCircle, Pencil, Plus, Trash } from "lucide-react"

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
import { Separator } from "@/components/ui/separator"

import { PROVIDERS, providerById } from "@/lib/providers"

interface KeyItem {
  id: string
  provider: string
  label: string
  baseUrl: string
  model: string
  keyHint: string
  isDefault: boolean
}

interface FormState {
  provider: string
  baseUrl: string
  model: string
  label: string
  apiKey: string
  isDefault: boolean
}

function initialForm(): FormState {
  return {
    provider: PROVIDERS[0].id,
    baseUrl: PROVIDERS[0].baseUrl,
    model: PROVIDERS[0].models[0] ?? "",
    label: "",
    apiKey: "",
    isDefault: false,
  }
}

export function ApiKeysManager() {
  const [keys, setKeys] = useState<KeyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/keys")
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { keys?: KeyItem[] }
      setKeys(data.keys ?? [])
    } catch {
      setError("Не удалось загрузить ключи")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function selectProvider(id: string) {
    const p = providerById(id)
    setForm((f) => ({
      ...f,
      provider: id,
      baseUrl: p?.baseUrl ?? "",
      model: p && p.models.length > 0 ? p.models[0] : "",
    }))
  }

  function startEdit(k: KeyItem) {
    setEditingId(k.id)
    setForm({
      provider: k.provider,
      baseUrl: k.baseUrl,
      model: k.model,
      label: k.label,
      apiKey: "",
      isDefault: k.isDefault,
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm(initialForm())
  }

  async function submit() {
    setSaving(true)
    setError(null)

    const payload = {
      provider: form.provider,
      label: form.label,
      baseUrl: form.baseUrl,
      model: form.model,
      isDefault: form.isDefault,
      ...(form.apiKey ? { apiKey: form.apiKey } : {}),
    }

    try {
      const res = await fetch(editingId ? `/api/keys/${editingId}` : "/api/keys", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data?.error ?? "Ошибка сохранения")
      }

      resetForm()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения")
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    setError(null)
    await fetch(`/api/keys/${id}`, { method: "DELETE" })
    await load()
  }

  const currentProvider = providerById(form.provider)
  const providerName = (id: string) => providerById(id)?.name ?? "Свой endpoint"

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Изменить ключ" : "Добавить ключ"}</CardTitle>
          <CardDescription>
            Ключи хранятся зашифрованными. Ключ по умолчанию используется при
            генерации CV.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Провайдер</Label>
              <Select value={form.provider} onValueChange={selectProvider}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Base URL</Label>
              <Input
                value={form.baseUrl}
                onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
                placeholder="https://api.example.com/v1"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Модель</Label>
              <Input
                list="model-options"
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                placeholder="deepseek-chat"
              />
              <datalist id="model-options">
                {(currentProvider?.models ?? []).map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Название (необязательно)</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="Мой DeepSeek"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>API-ключ</Label>
            <Input
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder={editingId ? "Оставьте пустым, чтобы не менять" : "sk-…"}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.isDefault}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isDefault: v === true }))}
            />
            Использовать по умолчанию
          </label>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex gap-2">
            <Button onClick={submit} disabled={saving}>
              {saving ? (
                <LoaderCircle className="animate-spin" />
              ) : editingId ? (
                "Сохранить"
              ) : (
                <>
                  <Plus /> Добавить
                </>
              )}
            </Button>
            {editingId ? (
              <Button variant="ghost" onClick={resetForm}>
                Отмена
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ключей пока нет. Добавьте свой или используйте серверный ключ-фолбэк.
          </p>
        ) : (
          keys.map((k) => (
            <div
              key={k.id}
              className="flex flex-col gap-2 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {k.label || providerName(k.provider)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {providerName(k.provider)} · {k.model}
                  </span>
                  {k.isDefault ? <Badge>По умолчанию</Badge> : null}
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {k.baseUrl} · sk{k.keyHint}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(k)}
                >
                  <Pencil /> Изменить
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => remove(k.id)}
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
