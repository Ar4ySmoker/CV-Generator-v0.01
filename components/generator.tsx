"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"

import { CvForm } from "@/components/form/cv-form"
import { DisclaimerDialog } from "@/components/form/disclaimer-dialog"
import { ModeSelector } from "@/components/form/mode-selector"

import type { CvFormValues, Mode } from "@/lib/schemas"

export interface GeneratorOptions {
  initialValues?: CvFormValues
  vacancyText?: string
  generateExtras?: { save?: boolean; applicationId?: string; profileId?: string }
  onGenerated?: () => void
}

export function Generator({
  initialValues,
  vacancyText,
  generateExtras,
  onGenerated,
}: GeneratorOptions) {
  const { status } = useSession()
  const [mode, setMode] = useState<Mode | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)

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

  let content
  if (mode && (mode !== "generate_experience" || accepted)) {
    content = (
      <CvForm
        mode={mode}
        disclaimerAccepted={accepted}
        onBack={reset}
        initialValues={initialValues}
        vacancyText={vacancyText}
        generateExtras={generateExtras}
        allowSaveProfile={status === "authenticated"}
        onGenerated={onGenerated}
      />
    )
  } else {
    content = <ModeSelector onSelect={handleSelect} />
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
