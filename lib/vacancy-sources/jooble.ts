import type { SourceVacancy, VacancySourceProvider } from "./types"

interface JoobleJob {
  title: string
  location?: string
  snippet?: string
  salary?: string
  source?: string
  link?: string
  company?: string
  updated?: string
  id?: string | number
}

function mapJob(job: JoobleJob): SourceVacancy {
  return {
    externalId: String(job.id ?? job.link ?? job.title),
    title: job.title,
    company: job.company || "Компания",
    location: job.location,
    salaryMin: null,
    salaryMax: null,
    currency: null,
    url: job.link ?? "",
    description: job.snippet,
    tags: job.source ? [job.source] : [],
    remote: /удален|дистанцион|remote/i.test(`${job.title} ${job.location ?? ""}`),
    source: "jooble",
    sourceLabel: "Jooble",
    postedAt: job.updated,
  }
}

export const joobleProvider: VacancySourceProvider = {
  id: "jooble",
  name: "Jooble",
  async search(q: string): Promise<SourceVacancy[]> {
    const key = process.env.JOOBLE_API_KEY
    if (!key) {
      throw new Error("Jooble не настроен (нужен JOOBLE_API_KEY)")
    }
    const res = await fetch(`https://jooble.org/api/${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keywords: q.trim(),
        location: process.env.JOOBLE_LOCATION ?? "",
        page: "1",
      }),
    })
    if (!res.ok) {
      throw new Error(`Jooble недоступен (HTTP ${res.status})`)
    }
    const data = (await res.json()) as { jobs?: JoobleJob[] }
    return (data.jobs ?? [])
      .map(mapJob)
      .filter((j) => j.url)
      .slice(0, 50)
  },
}
