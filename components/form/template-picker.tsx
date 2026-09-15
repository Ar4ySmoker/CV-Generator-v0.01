"use client"

import { ACCENT_COLORS, CV_TEMPLATES, type CvTemplate } from "@/lib/cv-templates"
import { cn } from "@/lib/utils"

function Preview({ template, accent }: { template: CvTemplate; accent: string }) {
  const accentHex = `#${accent}`
  return (
    <div className="flex aspect-[3/4] w-full flex-col gap-1.5 rounded-md border border-border/40 bg-background p-2.5">
      <div
        className="h-2.5 w-4/5 rounded-[2px]"
        style={{ backgroundColor: accentHex }}
      />
      <div className="h-1.5 w-1/2 rounded-[2px] bg-muted-foreground/40" />
      <div className="mt-1 flex items-center gap-1">
        {template.heading === "bar" ? (
          <div
            className="h-4 w-0.5 shrink-0 rounded-[1px]"
            style={{ backgroundColor: accentHex }}
          />
        ) : null}
        <div
          className="h-1.5 w-1/3 rounded-[2px]"
          style={{
            backgroundColor: template.heading === "plain" ? "var(--muted-foreground)" : accentHex,
            boxShadow:
              template.heading === "underline"
                ? `0 2px 0 ${accentHex}`
                : undefined,
          }}
        />
      </div>
      <div className="h-1 w-full rounded-[2px] bg-muted-foreground/25" />
      <div className="h-1 w-5/6 rounded-[2px] bg-muted-foreground/25" />
      <div className="h-1 w-4/6 rounded-[2px] bg-muted-foreground/25" />
    </div>
  )
}

export function TemplatePicker({
  templateId,
  accentColor,
  onTemplate,
  onAccent,
}: {
  templateId: string
  accentColor: string
  onTemplate: (id: string) => void
  onAccent: (color: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium text-muted-foreground">Шаблон</p>
      <div className="grid grid-cols-3 gap-2">
        {CV_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTemplate(t.id)}
            className={cn(
              "flex flex-col gap-2 rounded-xl border border-border/60 p-2 text-left transition-colors",
              templateId === t.id && "border-primary ring-2 ring-primary/20"
            )}
          >
            <Preview
              template={t}
              accent={accentColor || t.accent}
            />
            <span className="text-center text-xs font-medium">{t.name}</span>
          </button>
        ))}
      </div>

      <p className="text-xs font-medium text-muted-foreground">Акцентный цвет</p>
      <div className="flex flex-wrap gap-2">
        {ACCENT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onAccent(c)}
            aria-label={`Цвет #${c}`}
            className={cn(
              "size-7 rounded-full border border-border/60 transition-transform",
              accentColor === c && "ring-2 ring-primary ring-offset-2"
            )}
            style={{ backgroundColor: `#${c}` }}
          />
        ))}
      </div>
    </div>
  )
}
