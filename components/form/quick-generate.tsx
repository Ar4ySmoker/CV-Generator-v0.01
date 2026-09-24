"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Wand } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { GenerateOptions } from "@/components/form/generate-options"
import type { CustomThemeOption } from "@/components/form/template-picker"

import type { CvFormValues, CvLength, Mode } from "@/lib/schemas"

export function QuickGenerate({
  profileLabel,
  profileData,
  mode,
  vacancy,
  generateExtras,
  allowSaveProfile,
  onBack,
  onManual,
  onGenerated,
}: {
  profileLabel?: string
  profileData: CvFormValues
  mode: Mode
  vacancy?: { source: "text" | "url"; text?: string; url?: string }
  generateExtras?: { save?: boolean; applicationId?: string; profileId?: string }
  allowSaveProfile?: boolean
  onBack: () => void
  onManual: () => void
  onGenerated?: () => void
}) {
  const [cvLength, setCvLength] = useState<CvLength>("free")
  const [templateId, setTemplateId] = useState("classic")
  const [accentColor, setAccentColor] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [themeId, setThemeId] = useState("")
  const [themes, setThemes] = useState<CustomThemeOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!allowSaveProfile) return
    let cancelled = false
    fetch("/api/cv-themes")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { themes?: CustomThemeOption[] } | null) => {
        if (!cancelled && data?.themes) setThemes(data.themes)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [allowSaveProfile])

  async function submit() {
    setLoading(true)
    setError(null)
    try {
      const vacancyValue = vacancy
        ? vacancy.source === "url"
          ? { source: "url" as const, url: vacancy.url ?? "" }
          : vacancy.text?.trim()
            ? { source: "text" as const, text: vacancy.text }
            : undefined
        : undefined

      const base =
        mode === "generate_experience"
          ? {
              personal: profileData.personal,
              skills: [],
              experience: [],
              education: [],
              projects: [],
              languages: [],
            }
          : {
              personal: profileData.personal,
              skills: profileData.skills,
              experience: profileData.experience,
              education: profileData.education,
              projects: profileData.projects,
              languages: profileData.languages,
            }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...base,
          vacancy: vacancyValue,
          mode,
          disclaimerAccepted:
            mode === "generate_experience" ? true : undefined,
          templateId,
          accentColor: accentColor || undefined,
          length: cvLength,
          customPrompt: customPrompt.trim() || undefined,
          themeId: themeId || undefined,
          ...generateExtras,
        }),
      })

      if (!res.ok) {
        let message = "Не удалось сгенерировать CV"
        try {
          const data = (await res.json()) as { error?: string }
          if (data?.error) message = data.error
        } catch {
          // ignore json parse error
        }
        throw new Error(message)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "CV.docx"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      onGenerated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardContent className="flex flex-col gap-5 px-6 py-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-medium">
            Проверьте перед генерацией
          </h2>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft /> Назад
          </Button>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
          {profileLabel ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Профиль:</span>
              <span className="font-medium">{profileLabel}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Вакансия:</span>
            <span className="font-medium">
              {vacancy?.text?.trim() || vacancy?.url ? "задана" : "не задана"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              ИИ выберет только релевантный опыт и навыки
            </Badge>
          </div>
        </div>

        <GenerateOptions
          cvLength={cvLength}
          onLength={setCvLength}
          templateId={templateId}
          onTemplate={setTemplateId}
          themeId={themeId}
          onTheme={setThemeId}
          accentColor={accentColor}
          onAccent={setAccentColor}
          customPrompt={customPrompt}
          onPrompt={setCustomPrompt}
          themes={themes}
          allowSaveProfile={allowSaveProfile}
        />

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="outline" onClick={onManual}>
            Заполнить вручную
          </Button>
          <Button type="button" onClick={submit} disabled={loading}>
            <Wand /> {loading ? "Генерируем…" : "Сгенерировать CV"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
