export type CvTemplateId = "classic" | "modern" | "minimal"

export interface CvThemeStyle {
  font: string
  accent: string
  body: string
  gray: string
  heading: "underline" | "bar" | "plain"
  accentRule: boolean
}

export interface CvTemplate extends CvThemeStyle {
  id: CvTemplateId
  name: string
}

export const CV_TEMPLATES: CvTemplate[] = [
  {
    id: "classic",
    name: "Классический",
    font: "Calibri",
    accent: "1F3B63",
    body: "222222",
    gray: "595F66",
    heading: "underline",
    accentRule: false,
  },
  {
    id: "modern",
    name: "Современный",
    font: "Calibri",
    accent: "2563EB",
    body: "1F2937",
    gray: "6B7280",
    heading: "bar",
    accentRule: true,
  },
  {
    id: "minimal",
    name: "Минимализм",
    font: "Calibri",
    accent: "222222",
    body: "222222",
    gray: "595F66",
    heading: "plain",
    accentRule: false,
  },
]

export function cvTemplateById(id?: string): CvTemplate {
  return CV_TEMPLATES.find((t) => t.id === id) ?? CV_TEMPLATES[0]
}

export const ACCENT_COLORS = [
  "1F3B63",
  "2563EB",
  "0E7490",
  "0F766E",
  "B91C1C",
  "6D28D9",
  "222222",
]
