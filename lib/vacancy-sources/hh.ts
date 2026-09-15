import type { SearchOptions, SourceVacancy, VacancySourceProvider } from "./types"

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
}

interface HhItem {
  id: string
  name: string
  alternate_url: string
  published_at?: string
  employer?: { name?: string }
  area?: { name?: string }
  salary?: { from?: number | null; to?: number | null; currency?: string }
  snippet?: { requirement?: string; responsibility?: string }
}

function mapItem(item: HhItem): SourceVacancy {
  const description = [item.snippet?.requirement, item.snippet?.responsibility]
    .filter(Boolean)
    .map((s) => stripHtml(s ?? ""))
    .join(" ")
  return {
    externalId: item.id,
    title: item.name,
    company: item.employer?.name || "Компания",
    location: item.area?.name,
    salaryMin: item.salary?.from ?? null,
    salaryMax: item.salary?.to ?? null,
    currency: item.salary?.currency ?? null,
    url: item.alternate_url,
    description: description || undefined,
    remote: true,
    source: "hh",
    sourceLabel: "hh.ru",
    postedAt: item.published_at,
  }
}

export const hhProvider: VacancySourceProvider = {
  id: "hh",
  name: "hh.ru",
  async search(q: string, opts: SearchOptions): Promise<SourceVacancy[]> {
    const params = new URLSearchParams()
    if (q.trim()) params.set("text", q.trim())
    if (opts.remote) params.set("schedule", "remote")
    params.set("per_page", "50")
    params.set("search_field", "name")

    const res = await fetch(`https://api.hh.ru/vacancies?${params.toString()}`, {
      headers: {
        "User-Agent":
          process.env.HH_USER_AGENT ??
          "CV-Generator/0.1 (developerar4y@gmail.com)",
      },
    })
    if (!res.ok) {
      throw new Error(`hh.ru недоступен (HTTP ${res.status})`)
    }
    const data = (await res.json()) as { items?: HhItem[] }
    return (data.items ?? []).map(mapItem)
  },
}
