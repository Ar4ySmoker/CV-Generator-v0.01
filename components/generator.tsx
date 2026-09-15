"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Clipboard, Link2, Target } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

import { CvForm } from "@/components/form/cv-form"
import { DisclaimerDialog } from "@/components/form/disclaimer-dialog"
import { ModeSelector } from "@/components/form/mode-selector"

import type { CvFormValues, Mode } from "@/lib/schemas"

export interface GeneratorOptions {
  initialValues?: CvFormValues
  vacancyText?: string
  generateExtras?: { save?: boolean; applicationId?: string; profileId?: string }
  onGenerated?: () => void
  showVacancyEntry?: boolean
}

export function Generator({
  initialValues,
  vacancyText,
  generateExtras,
  onGenerated,
  showVacancyEntry = true,
}: GeneratorOptions) {
  const { status } = useSession()
  const [mode, setMode] = useState<Mode | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [vacancySource, setVacancySource] = useState<"text" | "url">("text")
  const [vacancyValue, setVacancyValue] = useState("")

  function handleSelect(next: Mode) {
    if (next === "generate_experience") {
      setMode(next)
      setDisclaimerOpen(true)
    } else {
      setMode(next)
      setAccepted(false)
    }
  }

  function reset() {
    setMode(null)
    setAccepted(false)
    setDisclaimerOpen(false)
  }

  const initialVacancy = vacancyValue.trim()
    ? {
        source: vacancySource,
        text: vacancySource === "text" ? vacancyValue : "",
        url: vacancySource === "url" ? vacancyValue : "",
      }
    : undefined

  let content
  if (mode && (mode !== "generate_experience" || accepted)) {
    content = (
      <CvForm
        mode={mode}
        disclaimerAccepted={accepted}
        onBack={reset}
        initialValues={initialValues}
        vacancyText={vacancyText}
        initialVacancy={initialVacancy}
        generateExtras={generateExtras}
        allowSaveProfile={status === "authenticated"}
        onGenerated={onGenerated}
      />
    )
  } else {
    content = (
      <div className="flex flex-col gap-6">
        {showVacancyEntry ? (
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target className="size-4 text-primary" />
                Есть вакансия? Подгоним CV под неё
              </div>
              <RadioGroup
                value={vacancySource}
                onValueChange={(v) => setVacancySource(v as "text" | "url")}
                className="gap-2"
              >
                <Label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 p-3 text-sm font-normal has-[[data-checked]]:border-primary">
                  <RadioGroupItem value="text" />
                  <Clipboard className="size-4 text-muted-foreground" />
                  Вставить текст
                </Label>
                <Label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 p-3 text-sm font-normal has-[[data-checked]]:border-primary">
                  <RadioGroupItem value="url" />
                  <Link2 className="size-4 text-muted-foreground" />
                  Указать ссылку
                </Label>
              </RadioGroup>
              {vacancySource === "text" ? (
                <Textarea
                  className="min-h-24"
                  placeholder="Вставьте описание вакансии: обязанности, требования, стек…"
                  value={vacancyValue}
                  onChange={(e) => setVacancyValue(e.target.value)}
                />
              ) : (
                <Input
                  type="url"
                  placeholder="https://hh.ru/vacancy/…"
                  value={vacancyValue}
                  onChange={(e) => setVacancyValue(e.target.value)}
                />
              )}
            </div>
          </div>
        ) : null}
        <ModeSelector onSelect={handleSelect} />
      </div>
    )
  }

  return (
    <>
      {content}
      <DisclaimerDialog
        open={disclaimerOpen}
        onConfirm={() => {
          setDisclaimerOpen(false)
          setAccepted(true)
        }}
        onCancel={() => {
          setDisclaimerOpen(false)
          setMode(null)
          setAccepted(false)
        }}
      />
    </>
  )
}
