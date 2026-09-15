"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { FileUp, Pencil, Plus, Trash, Wand } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"

import { CvForm } from "@/components/form/cv-form"
import { Generator } from "@/components/generator"

import type { CvFormValues } from "@/lib/schemas"

interface ProfileItem {
  id: string
  label: string
  isDefault: boolean
  data: CvFormValues
  updatedAt: string
}

type View = "list" | "edit" | "generate"

export function ProfilesManager() {
  const [profiles, setProfiles] = useState<ProfileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>("list")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [label, setLabel] = useState("")
  const [importOpen, setImportOpen] = useState(false)
  const [importLabel, setImportLabel] = useState("")
  const [importRaw, setImportRaw] = useState("")
  const [importError, setImportError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/profiles")
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { profiles?: ProfileItem[] }
      setProfiles(data.profiles ?? [])
    } catch {
      setError("Не удалось загрузить профили")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function startEdit(id: string | null) {
    setEditingId(id)
    setView("edit")
  }

  function startGenerate(id: string) {
    setEditingId(id)
    setView("generate")
  }

  function startRename(p: ProfileItem) {
    setRenamingId(p.id)
    setLabel(p.label)
  }

  async function saveRename() {
    if (!renamingId || !label.trim()) return
    await fetch(`/api/profiles/${renamingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() }),
    })
    setRenamingId(null)
    await load()
  }

  async function setDefault(id: string) {
    await fetch(`/api/profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    })
    await load()
  }

  async function remove(id: string) {
    await fetch(`/api/profiles/${id}`, { method: "DELETE" })
    await load()
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImportRaw(String(reader.result ?? ""))
    reader.readAsText(file)
  }

  async function submitImport() {
    setImporting(true)
    setImportError(null)
    try {
      const res = await fetch("/api/profiles/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: importLabel, raw: importRaw }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось импортировать")
      }
      setImportOpen(false)
      setImportRaw("")
      setImportLabel("")
      await load()
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Не удалось импортировать")
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  if (view === "edit") {
    const editing = editingId
      ? profiles.find((p) => p.id === editingId)
      : undefined
    return (
      <CvForm
        mode="with_experience"
        disclaimerAccepted={false}
        onBack={() => setView("list")}
        initialValues={editing?.data}
        initialLabel={editing?.label}
        profileId={editing?.id}
        submitMode="saveProfile"
        onSaved={() => {
          setView("list")
          load()
        }}
      />
    )
  }

  if (view === "generate") {
    const profile = profiles.find((p) => p.id === editingId)
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Профиль: {profile?.label}
          </p>
          <Button variant="ghost" size="sm" onClick={() => setView("list")}>
            Назад к списку
          </Button>
        </div>
        <Generator
          initialValues={profile?.data}
          onGenerated={() => {
            setView("list")
            load()
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => startEdit(null)}>
          <Plus /> Новый профиль
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setImportError(null)
            setImportOpen(true)
          }}
        >
          <FileUp /> Импорт
        </Button>
      </div>

      {profiles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Профилей пока нет. Создайте профиль с вашими данными — он будет
          подставляться при генерации CV.
        </p>
      ) : (
        profiles.map((p) => (
          <div
            key={p.id}
            className="flex flex-col gap-3 rounded-xl border border-border/60 p-4"
          >
            <div className="flex items-center gap-2">
              {renamingId === p.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                  <Button size="sm" onClick={saveRename}>
                    Сохранить
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setRenamingId(null)}
                  >
                    Отмена
                  </Button>
                </div>
              ) : (
                <>
                  <span className="font-medium">{p.label}</span>
                  {p.isDefault ? <Badge>По умолчанию</Badge> : null}
                </>
              )}
            </div>

            {renamingId !== p.id ? (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" onClick={() => startEdit(p.id)}>
                  Редактировать
                </Button>
                <Button size="sm" variant="secondary" onClick={() => startGenerate(p.id)}>
                  <Wand /> Сгенерировать CV
                </Button>
                {!p.isDefault ? (
                  <Button size="sm" variant="ghost" onClick={() => setDefault(p.id)}>
                    По умолчанию
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startRename(p)}
                >
                  <Pencil />
                  <span className="sr-only">Переименовать</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => remove(p.id)}
                >
                  <Trash />
                  <span className="sr-only">Удалить</span>
                </Button>
              </div>
            ) : null}
          </div>
        ))
      )}

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Импорт профиля</DialogTitle>
            <DialogDescription>
              Вставьте содержимое profile.yaml (или JSON) либо выберите файл.
              Импортируется русская версия.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Название профиля</Label>
              <Input
                value={importLabel}
                onChange={(e) => setImportLabel(e.target.value)}
                placeholder="Напр. Full Stack Developer"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Содержимое</Label>
              <Textarea
                className="min-h-48 font-mono text-xs"
                value={importRaw}
                onChange={(e) => setImportRaw(e.target.value)}
                placeholder="positioning: …"
              />
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".yaml,.yml,.json"
              className="hidden"
              onChange={handleFile}
            />
            <Button
              variant="ghost"
              size="sm"
              className="w-fit"
              onClick={() => fileRef.current?.click()}
            >
              <FileUp /> Выбрать файл
            </Button>
          </div>
          {importError ? (
            <Alert variant="destructive">
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Отмена
            </Button>
            <Button onClick={submitImport} disabled={importing}>
              {importing ? "Импортируем…" : "Импортировать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
