"use client"

import { Briefcase, Rocket, Wand } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"

import type { Mode } from "@/lib/schemas"

const MODES: Array<{
  id: Mode
  title: string
  description: string
  icon: typeof Briefcase
  badge?: string
}> = [
  {
    id: "with_experience",
    title: "С опытом",
    description:
      "Введите реальный опыт — CV адаптируется под вакансию: пересортируем навыки, усилим формулировки.",
    icon: Briefcase,
  },
  {
    id: "junior",
    title: "Без опыта (junior)",
    description:
      "Честное CV из того, что есть: навыки, образование, курсы, пет-проекты, волонтёрство.",
    icon: Rocket,
  },
  {
    id: "generate_experience",
    title: "Сгенерировать опыт",
    description:
      "ИИ придумает стаж работы под ваши навыки и вакансию. Требует подтверждения рисков.",
    icon: Wand,
    badge: "Дисклеймер",
  },
]

export function ModeSelector({
  onSelect,
}: {
  onSelect: (mode: Mode) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {MODES.map((mode) => {
        const Icon = mode.icon
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onSelect(mode.id)}
            className="text-left"
          >
            <Card className="h-full cursor-pointer transition-colors hover:ring-2 hover:ring-primary/60">
              <div className="flex flex-col gap-3 px-6 py-6">
                <div className="flex items-center justify-between">
                  <Icon className="size-6 text-primary" />
                  {mode.badge ? (
                    <Badge variant="secondary">{mode.badge}</Badge>
                  ) : null}
                </div>
                <CardTitle>{mode.title}</CardTitle>
                <CardDescription>{mode.description}</CardDescription>
              </div>
            </Card>
          </button>
        )
      })}
    </div>
  )
}
