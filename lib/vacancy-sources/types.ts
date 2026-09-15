export type VacancySourceId = "hh" | "remoteok"

export interface SourceVacancy {
  externalId: string
  title: string
  company: string
  location?: string
  salaryMin?: number | null
  salaryMax?: number | null
  currency?: string | null
  url: string
  description?: string
  tags?: string[]
  remote: boolean
  source: VacancySourceId
  sourceLabel: string
  postedAt?: string
}

export interface SearchOptions {
  remote: boolean
}

export interface SourceStatus {
  id: VacancySourceId
  name: string
  ok: boolean
  error?: string
}

export interface VacancySearchResult {
  results: SourceVacancy[]
  sources: SourceStatus[]
}

export interface VacancySourceProvider {
  id: VacancySourceId
  name: string
  search(q: string, opts: SearchOptions): Promise<SourceVacancy[]>
}
