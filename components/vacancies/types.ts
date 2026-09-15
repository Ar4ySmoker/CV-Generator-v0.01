export type VacancyStatusValue = "saved" | "applied" | "skipped"

export interface VacancyItem {
  id: string
  company: string
  role: string
  country: string | null
  salaryMin: number | null
  salaryMax: number | null
  currency: string | null
  sourceUrl: string | null
  sourceType: string | null
  description: string | null
  tags: string[]
  source: "manual" | "shared"
  teamId: string | null
  sharedById: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  status: VacancyStatusValue | null
  applicationId: string | null
  teamName: string | null
}
