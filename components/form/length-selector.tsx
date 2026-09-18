"use client"

import { Layers, RectangleHorizontal } from "lucide-react"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import type { CvLength } from "@/lib/schemas"

const OPTIONS: Array<{
  id: CvLength
  title: string
  description: string
  icon: typeof Layers
}> = [
  {
    id: "free",
    title: "Произвольная форма",
    description: "Полное CV без ограничений по объёму.",
    icon: Layers,
  },
  {
    id: "one_page",
    title: "Одна страница",
    description: "Сожмём самое важное, чтобы уместилось на одну страницу A4.",
    icon: RectangleHorizontal,
  },
]

export function LengthSelector({
  value,
  onChange,
}: {
  value: CvLength
  onChange: (value: CvLength) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium text-muted-foreground">Объём CV</p>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as CvLength)}
        className="grid gap-2 sm:grid-cols-2"
      >
        {OPTIONS.map((opt) => {
          const Icon = opt.icon
          return (
            <Label
              key={opt.id}
              className="flex cursor-pointer items-start gap-2 rounded-xl border border-border/60 p-3 text-sm font-normal has-[[data-checked]]:border-primary"
            >
              <RadioGroupItem value={opt.id} className="mt-0.5" />
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <Icon className="size-4 text-muted-foreground" />
                  {opt.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {opt.description}
                </span>
              </span>
            </Label>
          )
        })}
      </RadioGroup>
    </div>
  )
}
