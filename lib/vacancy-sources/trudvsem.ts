import type { SearchOptions, SourceVacancy, VacancySourceProvider } from "./types"

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

interface TrudVacancy {
  id: string
  "job-name": string
  "vac_url": string
  "creation-date"?: string
  salary?: string
  salary_min?: number | null
  salary_max?: number | null
  region?: { name?: string }
  company?: { name?: string }
  schedule?: string
  employment?: string
  requirements?: string
  duty?: string
  addresses?: { address?: { location?: string }[] }
}

function isRemote(v: TrudVacancy): boolean {
  const locations = (v.addresses?.address ?? [])
    .map((a) => a.location ?? "")
    .join(" ")
  const hay = `${v.schedule ?? ""} ${locations}`.toLowerCase()
  return /удален|дистанцион/.test(hay)
}

function mapItem(v: TrudVacancy): SourceVacancy {
  const description = [v.requirements, v.duty].filter(Boolean).join("\n\n")
  return {
    externalId: v.id,
    title: v["job-name"],
    company: v.company?.name || "Компания",
    location: v.region?.name,
    salaryMin: v.salary_min ?? null,
    salaryMax: v.salary_max ?? null,
    currency: v.salary_min != null || v.salary_max != null ? "RUB" : null,
    url: v["vac_url"],
    description: description ? description.slice(0, 20000) : undefined,
    remote: isRemote(v),
    source: "trudvsem",
    sourceLabel: "Работа России",
    postedAt: v["creation-date"],
  }
}

export const trudvsemProvider: VacancySourceProvider = {
  id: "trudvsem",
  name: "Работа России",
  async search(q: string, opts: SearchOptions): Promise<SourceVacancy[]> {
    const params = new URLSearchParams()
    if (q.trim()) params.set("text", q.trim())
    params.set("limit", "50")
    params.set("offset", "0")

    const res = await fetch(
      `https://opendata.trudvsem.ru/api/v1/vacancies?${params.toString()}`,
      { headers: { "User-Agent": UA } }
    )
    if (!res.ok) {
      throw new Error(`Работа России недоступен (HTTP ${res.status})`)
    }
    const data = (await res.json()) as {
      results?: { vacancies?: { vacancy: TrudVacancy }[] }
    }

    let list = (data.results?.vacancies ?? []).map((v) => mapItem(v.vacancy))
    if (opts.remote) {
      list = list.filter((v) => v.remote)
    }
    return list.slice(0, 50)
  },
}
