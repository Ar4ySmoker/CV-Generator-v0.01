"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Clipboard, Link2, Target, User } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { CvForm } from "@/components/form/cv-form"
import { DisclaimerDialog } from "@/components/form/disclaimer-dialog"
import { ModeSelector } from "@/components/form/mode-selector"
import { PostGenerateActions, type VacancyRef } from "@/components/form/post-generate-actions"
import { QuickGenerate } from "@/components/form/quick-generate"

import type { CvFormValues, Mode } from "@/lib/schemas"

export interface GeneratorOptions {
  initialValues?: CvFormValues
  vacancyText?: string
  generateExtras?: { save?: boolean; applicationId?: string; profileId?: string }
  onGenerated?: (ctx?: { vacancy?: VacancyRef }) => void
  showVacancyEntry?: boolean
  showProfilePicker?: boolean
  showPostGenerate?: boolean
}

interface ProfileItem {
  id: string
  label: string
  isDefault: boolean
  data: CvFormValues
}

export function Generator({
  initialValues,
  vacancyText,
  generateExtras,
  onGenerated,
  showVacancyEntry = true,
  showProfilePicker = true,
  showPostGenerate = false,
}: GeneratorOptions) {
  const { status } = useSession()
  const [mode, setMode] = useState<Mode | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [vacancySource, setVacancySource] = useState<"text" | "url">("text")
  const [vacancyValue, setVacancyValue] = useState("")
  const [profiles, setProfiles] = useState<ProfileItem[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState("")
  const [manual, setManual] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [generatedVacancy, setGeneratedVacancy] = useState<VacancyRef | undefined>(
    undefined
  )

  useEffect(() => {
    if (status !== "authenticated" || !showProfilePicker || initialValues) return
    let cancelled = false
    fetch("/api/profiles")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { profiles?: ProfileItem[] } | null) => {
        if (!cancelled && data?.profiles?.length) {
          setProfiles(data.profiles)
          setSelectedProfileId(
            data.profiles.find((p) => p.isDefault)?.id ?? data.profiles[0].id
          )
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [status, showProfilePicker, initialValues])

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId)
  const effectiveInitialValues = initialValues ?? selectedProfile?.data

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
    setManual(false)
    setGenerated(false)
    setGeneratedVacancy(undefined)
  }

  function handleGenerated(ctx?: { vacancy?: VacancyRef }) {
    if (showPostGenerate) {
      setGenerated(true)
      setGeneratedVacancy(ctx?.vacancy)
    }
    onGenerated?.(ctx)
  }

  const initialVacancy = vacancyValue.trim()
    ? {
        source: vacancySource,
        text: vacancySource === "text" ? vacancyValue : "",
        url: vacancySource === "url" ? vacancyValue : "",
      }
    : undefined

  const effectiveVacancy =
    initialVacancy ??
    (vacancyText?.trim()
      ? { source: "text" as const, text: vacancyText.trim() }
      : undefined)

  let content
  if (mode && (mode !== "generate_experience" || accepted)) {
    if (!manual && effectiveInitialValues) {
      content = (
        <QuickGenerate
          profileLabel={selectedProfile?.label}
          profileData={effectiveInitialValues}
          mode={mode}
          vacancy={effectiveVacancy}
          generateExtras={generateExtras}
          allowSaveProfile={status === "authenticated"}
          onBack={reset}
          onManual={() => setManual(true)}
          onGenerated={handleGenerated}
        />
      )
    } else {
      content = (
        <CvForm
          mode={mode}
          disclaimerAccepted={accepted}
          onBack={reset}
          initialValues={effectiveInitialValues}
          vacancyText={vacancyText}
          initialVacancy={initialVacancy}
          generateExtras={generateExtras}
          allowSaveProfile={status === "authenticated"}
          onGenerated={handleGenerated}
        />
      )
    }
  } else {
    content = (
      <div className="flex flex-col gap-6">
        {showProfilePicker && status === "authenticated" && profiles.length > 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="size-4 text-primary" />
                Профиль
              </div>
              <Select
                value={selectedProfileId || "none"}
                onValueChange={(v) =>
                  setSelectedProfileId(v === "none" ? "" : v)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите профиль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без профиля (ввести вручную)</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}
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
      {showPostGenerate && generated ? (
        <PostGenerateActions vacancy={generatedVacancy} />
      ) : null}
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
