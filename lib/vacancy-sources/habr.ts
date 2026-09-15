import type { SearchOptions, SourceVacancy, VacancySourceProvider } from "./types"

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

interface HabrItem {
  id: number
  href: string
  title: string
  remoteWork?: boolean
  publishedDate?: { date?: string }
  location?: string | null
  company?: { title?: string }
  salary?: { from?: number | null; to?: number | null; currency?: string } | null
  predictedSalary?: { from?: number | null; to?: number | null; currency?: string } | null
  skills?: { title: string }[]
  locations?: { title: string }[]
}

function mapItem(item: HabrItem): SourceVacancy {
  const explicit = item.salary
  const salary =
    explicit && (explicit.from != null || explicit.to != null)
      ? explicit
      : item.predictedSalary

  return {
    externalId: String(item.id),
    title: item.title,
    company: item.company?.title || "Компания",
    location: item.locations?.[0]?.title || item.location || undefined,
    salaryMin: salary?.from ?? null,
    salaryMax: salary?.to ?? null,
    currency: salary?.currency ? salary.currency.toUpperCase() : null,
    url: `https://career.habr.com${item.href}`,
    tags: (item.skills ?? []).map((s) => s.title).slice(0, 8),
    remote: Boolean(item.remoteWork),
    source: "habr",
    sourceLabel: "Хабр Карьера",
    postedAt: item.publishedDate?.date,
  }
}

export const habrProvider: VacancySourceProvider = {
  id: "habr",
  name: "Хабр Карьера",
  async search(q: string, opts: SearchOptions): Promise<SourceVacancy[]> {
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    params.set("page", "1")
    params.set("per_page", "50")
    params.set("sort", "date")
    params.set("type", "all")

    const res = await fetch(
      `https://career.habr.com/api/frontend/vacancies?${params.toString()}`,
      {
        headers: { "User-Agent": UA, Accept: "application/json" },
      }
    )
    if (!res.ok) {
      throw new Error(`Хабр Карьера недоступен (HTTP ${res.status})`)
    }
    const data = (await res.json()) as { list?: HabrItem[] }

    let list = (data.list ?? []).map(mapItem)
    if (opts.remote) {
      list = list.filter((v) => v.remote)
    }
    return list.slice(0, 50)
  },
}
