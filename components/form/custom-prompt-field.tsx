"use client"

import { useEffect, useState } from "react"
import { Clipboard } from "lucide-react"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface PromptOption {
  id: string
  name: string
  content: string
}

export function CustomPromptField({
  value,
  onChange,
  allowSaveProfile,
}: {
  value: string
  onChange: (value: string) => void
  allowSaveProfile?: boolean
}) {
  const [prompts, setPrompts] = useState<PromptOption[]>([])

  useEffect(() => {
    if (!allowSaveProfile) return
    let cancelled = false
    fetch("/api/cv-prompts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { prompts?: PromptOption[] } | null) => {
        if (!cancelled && data?.prompts) setPrompts(data.prompts)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [allowSaveProfile])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Clipboard className="size-4 text-primary" />
        Свой промт (опционально)
      </div>

      {prompts.length > 0 ? (
        <Select
          onValueChange={(id) => {
            const p = prompts.find((x) => x.id === id)
            if (p) onChange(p.content)
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Загрузить сохранённый промт…" />
          </SelectTrigger>
          <SelectContent>
            {prompts.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label className="font-normal text-muted-foreground">
          Инструкции для генерации. Данные формы и строгая JSON-схема будут
          добавлены автоматически.
        </Label>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Напр. Пиши лаконично, без воды, выделяй метрики…"
          className="min-h-24 font-mono text-xs"
        />
      </div>
    </div>
  )
}
