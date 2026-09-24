"use client"

import { LengthSelector } from "@/components/form/length-selector"
import {
  TemplatePicker,
  type CustomThemeOption,
} from "@/components/form/template-picker"
import { CustomPromptField } from "@/components/form/custom-prompt-field"

import type { CvLength } from "@/lib/schemas"

export function GenerateOptions({
  cvLength,
  onLength,
  templateId,
  onTemplate,
  themeId,
  onTheme,
  accentColor,
  onAccent,
  customPrompt,
  onPrompt,
  themes,
  allowSaveProfile,
}: {
  cvLength: CvLength
  onLength: (value: CvLength) => void
  templateId: string
  onTemplate: (id: string) => void
  themeId: string
  onTheme: (id: string) => void
  accentColor: string
  onAccent: (color: string) => void
  customPrompt: string
  onPrompt: (value: string) => void
  themes: CustomThemeOption[]
  allowSaveProfile?: boolean
}) {
  return (
    <div className="flex flex-col gap-5">
      <LengthSelector value={cvLength} onChange={onLength} />
      <TemplatePicker
        templateId={templateId}
        themeId={themeId}
        accentColor={accentColor}
        onTemplate={(id) => {
          onTemplate(id)
          onTheme("")
        }}
        onTheme={onTheme}
        onAccent={onAccent}
        customThemes={themes}
      />
      <CustomPromptField
        value={customPrompt}
        onChange={onPrompt}
        allowSaveProfile={allowSaveProfile}
      />
    </div>
  )
}
