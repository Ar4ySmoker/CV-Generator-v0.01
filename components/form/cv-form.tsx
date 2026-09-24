"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  Code,
  Download,
  FolderGit2,
  GraduationCap,
  Languages,
  LoaderCircle,
  SlidersHorizontal,
  Target,
  User,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

import { cvFormSchema, type CvFormValues, type CvLength, type Mode } from "@/lib/schemas"
import { filenameFromContentDisposition } from "@/lib/format"

import type { VacancyRef } from "@/components/form/post-generate-actions"

import { PersonalStep } from "@/components/form/steps/personal-step"
import { SkillsStep } from "@/components/form/steps/skills-step"
import { ExperienceStep } from "@/components/form/steps/experience-step"
import { EducationStep } from "@/components/form/steps/education-step"
import { ProjectsStep } from "@/components/form/steps/projects-step"
import { LanguagesStep } from "@/components/form/steps/languages-step"
import { VacancyStep } from "@/components/form/steps/vacancy-step"
import { GenerateOptions } from "@/components/form/generate-options"
import type { CustomThemeOption } from "@/components/form/template-picker"

type StepId =
  | "personal"
  | "skills"
  | "experience"
  | "education"
  | "projects"
  | "languages"
  | "vacancy"
  | "options"

interface Step {
  id: StepId
  title: string
  description: string
  icon: typeof User
  fields: Array<keyof CvFormValues>
  component: React.ComponentType
}

const ALL_STEPS: Step[] = [
  {
    id: "personal",
    title: "Личные данные",
    description: "Имя и контакты — появятся в шапке CV",
    icon: User,
    fields: ["personal"],
    component: PersonalStep,
  },
  {
    id: "skills",
    title: "Навыки",
    description: "Технологии и уровень владения",
    icon: Code,
    fields: ["skills"],
    component: SkillsStep,
  },
  {
    id: "experience",
    title: "Опыт",
    description: "Места работы и достижения",
    icon: Briefcase,
    fields: ["experience"],
    component: ExperienceStep,
  },
  {
    id: "education",
    title: "Образование",
    description: "Учебные заведения и курсы",
    icon: GraduationCap,
    fields: ["education"],
    component: EducationStep,
  },
  {
    id: "projects",
    title: "Проекты",
    description: "Личные и рабочие проекты",
    icon: FolderGit2,
    fields: ["projects"],
    component: ProjectsStep,
  },
  {
    id: "languages",
    title: "Языки",
    description: "Языки и уровень владения",
    icon: Languages,
    fields: ["languages"],
    component: LanguagesStep,
  },
  {
    id: "vacancy",
    title: "Вакансия",
    description: "Опционально — для адаптации CV",
    icon: Target,
    fields: [],
    component: VacancyStep,
  },
  {
    id: "options",
    title: "Оформление",
    description: "Объём, шаблон и доп. инструкции",
    icon: SlidersHorizontal,
    fields: [],
    component: () => null,
  },
]

const DEFAULT_VALUES: CvFormValues = {
  personal: {
    name: "",
    phone: "",
    email: "",
    location: "",
    telegram: "",
    github: "",
    site: "",
  },
  skills: [{ name: "", level: "intermediate" }],
  experience: [],
  education: [],
  projects: [],
  languages: [],
  vacancy: { source: "text", text: "" },
}

function buildSteps(mode: Mode): Step[] {
  if (mode === "generate_experience") {
    return ALL_STEPS.filter(
      (s) => s.id === "personal" || s.id === "vacancy" || s.id === "options"
    )
  }
  return ALL_STEPS.filter((s) => s.id !== "experience" || mode === "with_experience")
}

export function CvForm({
  mode,
  disclaimerAccepted,
  onBack,
  initialValues,
  vacancyText,
  initialVacancy,
  generateExtras,
  allowSaveProfile = false,
  onGenerated,
  submitMode = "generate",
  profileId,
  initialLabel = "",
  onSaved,
}: {
  mode: Mode
  disclaimerAccepted: boolean
  onBack: () => void
  initialValues?: CvFormValues
  vacancyText?: string
  initialVacancy?: { source: "text" | "url"; text?: string; url?: string }
  generateExtras?: { save?: boolean; applicationId?: string; profileId?: string }
  allowSaveProfile?: boolean
  onGenerated?: (ctx?: { vacancy?: VacancyRef }) => void
  submitMode?: "generate" | "saveProfile"
  profileId?: string
  initialLabel?: string
  onSaved?: () => void
}) {
  const isProfileMode = submitMode === "saveProfile"
  const steps = buildSteps(mode).filter(
    (s) => !(isProfileMode && (s.id === "vacancy" || s.id === "options"))
  )
  const [stepIndex, setStepIndex] = useState(0)
  const [label, setLabel] = useState(initialLabel)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [profileLabel, setProfileLabel] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [templateId, setTemplateId] = useState("classic")
  const [accentColor, setAccentColor] = useState("")
  const [cvLength, setCvLength] = useState<CvLength>("free")
  const [customPrompt, setCustomPrompt] = useState("")
  const [themeId, setThemeId] = useState("")
  const [themes, setThemes] = useState<CustomThemeOption[]>([])

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

  const defaultValues = useMemo<CvFormValues>(() => {
    const base: CvFormValues = initialValues
      ? { ...initialValues }
      : {
          personal: { ...DEFAULT_VALUES.personal },
          skills: DEFAULT_VALUES.skills.map((s) => ({ ...s })),
          experience: [],
          education: [],
          projects: [],
          languages: [],
          vacancy: { source: "text" as const, text: "" },
        }
    if (mode === "generate_experience") {
      base.skills = []
      base.experience = []
      base.education = []
      base.projects = []
      base.languages = []
    }
    if (initialVacancy && (initialVacancy.text?.trim() || initialVacancy.url?.trim())) {
      base.vacancy = {
        source: initialVacancy.source,
        text: initialVacancy.text ?? "",
        url: initialVacancy.url ?? "",
      }
    } else if (vacancyText) {
      base.vacancy = { source: "text", text: vacancyText }
    }
    return base
  }, [initialValues, vacancyText, initialVacancy, mode])

  const form = useForm<CvFormValues>({
    resolver: zodResolver(cvFormSchema),
    defaultValues,
    mode: "onTouched",
  })

  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const StepComponent = step.component
  const Icon = step.icon

  async function handleNext() {
    const valid = await form.trigger(step.fields)
    if (valid) {
      setError(null)
      setStepIndex((i) => Math.min(i + 1, steps.length - 1))
    }
  }

  function handleBack() {
    setError(null)
    if (stepIndex === 0) {
      onBack()
    } else {
      setStepIndex((i) => i - 1)
    }
  }

  async function onSubmit(values: CvFormValues) {
    setLoading(true)
    setError(null)

    if (isProfileMode) {
      if (!label.trim()) {
        setError("Укажите название профиля")
        setLoading(false)
        return
      }
      try {
        const res = await fetch(
          profileId ? `/api/profiles/${profileId}` : "/api/profiles",
          {
            method: profileId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label: label.trim(), data: values }),
          }
        )
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(data?.error ?? "Не удалось сохранить профиль")
        }
        setDone(true)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Не удалось сохранить профиль"
        )
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          mode,
          disclaimerAccepted,
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
      a.download = filenameFromContentDisposition(
        res.headers.get("Content-Disposition")
      )
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка")
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile() {
    if (!profileLabel.trim()) {
      setError("Введите название профиля")
      return
    }
    setSavingProfile(true)
    setError(null)
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: profileLabel.trim(), data: form.getValues() }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data?.error ?? "Не удалось сохранить профиль")
      }
      setProfileSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить профиль")
    } finally {
      setSavingProfile(false)
    }
  }

  if (done && isProfileMode) {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          <Check className="size-10 text-primary" />
          <h2 className="font-heading text-xl font-medium">Профиль сохранён</h2>
          <p className="text-sm text-muted-foreground">
            Данные сохранены. Теперь их можно использовать при генерации CV.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              onSaved?.()
              onBack()
            }}
          >
            Готово
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (done) {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          <Download className="size-10 text-primary" />
          <h2 className="font-heading text-xl font-medium">CV сформирован</h2>
          <p className="text-sm text-muted-foreground">
            Файл CV.docx загружен. Проверьте, как выглядит документ.
          </p>

          {!allowSaveProfile ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Данные не сохранены. Зарегистрируйтесь, чтобы хранить профиль и
                переиспользовать его при следующих откликах.
              </p>
              <Button asChild size="sm">
                <Link href="/register">Создать аккаунт</Link>
              </Button>
            </div>
          ) : null}

          {allowSaveProfile && !profileSaved ? (
            <div className="flex w-full max-w-xs flex-col gap-2">
              <Input
                placeholder="Название профиля (напр. Full Stack)"
                value={profileLabel}
                onChange={(e) => setProfileLabel(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={saveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? "Сохраняем…" : "Сохранить как профиль"}
              </Button>
            </div>
          ) : null}

          {profileSaved ? (
            <p className="text-sm text-primary">Профиль сохранён</p>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            variant="outline"
            onClick={() => {
              const vacancy = form.getValues().vacancy
              onGenerated?.({
                vacancy:
                  vacancy?.text?.trim() || vacancy?.url?.trim()
                    ? vacancy
                    : undefined,
              })
              onBack()
            }}
          >
            Готово
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <LoaderCircle className="size-8 animate-spin text-primary" />
          <h2 className="font-heading text-lg font-medium">Генерируем CV…</h2>
          <div className="flex w-full flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto w-full max-w-2xl">
        <Card>
          <CardContent className="flex flex-col gap-5 px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className="size-5 text-primary" />
                <div>
                  <h2 className="font-heading text-lg font-medium">{step.title}</h2>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                Шаг {stepIndex + 1} из {steps.length}
              </span>
            </div>

            <div className="flex gap-1">
              {steps.map((s, i) => (
                <div
                  key={s.id}
                  className={`h-1 flex-1 rounded-full ${
                    i <= stepIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <Separator />

            {isProfileMode ? (
              <div className="flex flex-col gap-1.5">
                <Label>Название профиля</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Напр. Full Stack Developer"
                />
              </div>
            ) : null}

            <StepComponent />

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {!isProfileMode && step.id === "options" ? (
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
            ) : null}

            <div className="flex items-center justify-between gap-2">
              <Button type="button" variant="outline" onClick={handleBack}>
                <ArrowLeft /> Назад
              </Button>
              {isLast ? (
                <Button type="submit" disabled={loading}>
                  {isProfileMode ? "Сохранить профиль" : "Сгенерировать CV"}
                </Button>
              ) : (
                <Button type="button" onClick={handleNext}>
                  Далее <ArrowRight />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
