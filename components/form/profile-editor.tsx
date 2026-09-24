"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import { cvFormSchema, type CvFormValues } from "@/lib/schemas"

import { PersonalStep } from "@/components/form/steps/personal-step"
import { SkillsStep } from "@/components/form/steps/skills-step"
import { ExperienceStep } from "@/components/form/steps/experience-step"
import { EducationStep } from "@/components/form/steps/education-step"
import { ProjectsStep } from "@/components/form/steps/projects-step"
import { LanguagesStep } from "@/components/form/steps/languages-step"

const EMPTY_PERSONAL = {
  name: "",
  phone: "",
  email: "",
  location: "",
  telegram: "",
  github: "",
  site: "",
}

function withDefaults(v?: CvFormValues): CvFormValues {
  return {
    personal: { ...EMPTY_PERSONAL, ...(v?.personal ?? {}) },
    skills:
      v?.skills && v.skills.length > 0
        ? v.skills
        : [{ name: "", level: "intermediate" }],
    experience: v?.experience ?? [],
    education: v?.education ?? [],
    projects: v?.projects ?? [],
    languages: v?.languages ?? [],
    vacancy: v?.vacancy ?? { source: "text", text: "" },
  }
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="font-heading text-base font-medium">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

export function ProfileEditor({
  initialValues,
  initialLabel = "",
  profileId,
  onSaved,
  onCancel,
}: {
  initialValues?: CvFormValues
  initialLabel?: string
  profileId?: string
  onSaved: () => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState(initialLabel)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CvFormValues>({
    resolver: zodResolver(cvFormSchema),
    defaultValues: withDefaults(initialValues),
    mode: "onTouched",
  })

  async function onSubmit(values: CvFormValues) {
    if (!label.trim()) {
      setError("Укажите название профиля")
      return
    }
    setSaving(true)
    setError(null)
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
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить профиль")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto w-full max-w-2xl">
        <Card>
          <CardContent className="flex flex-col gap-6 px-6 py-6">
            <div className="flex flex-col gap-1.5">
              <Label>Название профиля</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Напр. Full Stack Developer"
              />
            </div>

            <Section
              title="Личные данные"
              description="Имя и контакты — появятся в шапке CV"
            >
              <PersonalStep />
            </Section>
            <Separator />
            <Section title="Навыки" description="Технологии и уровень владения">
              <SkillsStep />
            </Section>
            <Separator />
            <Section
              title="Опыт работы"
              description="Места работы, достижения и домены"
            >
              <ExperienceStep />
            </Section>
            <Separator />
            <Section title="Образование" description="Учебные заведения и курсы">
              <EducationStep />
            </Section>
            <Separator />
            <Section title="Проекты" description="Личные и рабочие проекты">
              <ProjectsStep />
            </Section>
            <Separator />
            <Section title="Языки" description="Языки и уровень владения">
              <LanguagesStep />
            </Section>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={saving}>
                <Save /> {saving ? "Сохраняем…" : "Сохранить"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
