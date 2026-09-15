"use client"

import { useCallback, useEffect, useState } from "react"
import { Pencil, Trash } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ProfileItem {
  id: string
  label: string
  isDefault: boolean
  updatedAt: string
}

export function ProfilesManager() {
  const [profiles, setProfiles] = useState<ProfileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
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

  function startEdit(p: ProfileItem) {
    setEditingId(p.id)
    setLabel(p.label)
  }

  async function saveLabel() {
    if (!editingId || !label.trim()) return
    await fetch(`/api/profiles/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() }),
    })
    setEditingId(null)
    setLabel("")
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

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {profiles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Профилей пока нет. Сгенерируйте CV на главной и нажмите «Сохранить как
          профиль» — он появится здесь и будет доступен при создании откликов.
        </p>
      ) : (
        profiles.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-border/60 p-3"
          >
            {editingId === p.id ? (
              <div className="flex flex-1 items-center gap-2">
                <Input value={label} onChange={(e) => setLabel(e.target.value)} />
                <Button size="sm" onClick={saveLabel}>
                  Сохранить
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                >
                  Отмена
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium">{p.label}</span>
                {p.isDefault ? <Badge>По умолчанию</Badge> : null}
              </div>
            )}

            {editingId !== p.id ? (
              <div className="flex gap-1">
                {!p.isDefault ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDefault(p.id)}
                  >
                    По умолчанию
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => startEdit(p)}
                >
                  <Pencil />
                  <span className="sr-only">Переименовать</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
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
