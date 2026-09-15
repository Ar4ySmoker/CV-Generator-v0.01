"use client"

import { useCallback, useEffect, useState } from "react"
import { Pencil, Plus, Trash, Wand } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => startEdit(null)}
      >
        <Plus /> Новый профиль
      </Button>

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
    </div>
  )
}
