import type { SourceVacancy, VacancySourceProvider } from "./types"

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}

interface RemoteOkJob {
  id?: number | string
  position?: string
  company?: string
  location?: string
  salary_min?: number | null
  salary_max?: number | null
  description?: string
  url?: string
  tags?: string[]
  date?: string
}

let cache: { list: SourceVacancy[]; at: number } | null = null
const TTL = 5 * 60 * 1000

function mapJob(job: RemoteOkJob): SourceVacancy | null {
  if (!job.position || !job.company || !job.url) return null
  return {
    externalId: String(job.id ?? job.url),
    title: job.position,
    company: job.company,
    location: job.location || undefined,
    salaryMin: job.salary_min || null,
    salaryMax: job.salary_max || null,
    currency: job.salary_min ? "USD" : null,
    url: job.url,
    description: job.description ? stripHtml(job.description).slice(0, 20000) : undefined,
    tags: job.tags ?? [],
    remote: true,
    source: "remoteok",
    sourceLabel: "Remote OK",
    postedAt: job.date,
  }
}

async function fetchAll(): Promise<SourceVacancy[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.list

  const res = await fetch("https://remoteok.com/api")
  if (!res.ok) {
    throw new Error(`Remote OK недоступен (HTTP ${res.status})`)
  }
  const data = (await res.json()) as unknown[]
  const list = data
    .slice(1)
    .map((item) => mapJob(item as RemoteOkJob))
    .filter((x): x is SourceVacancy => x !== null)

  cache = { list, at: Date.now() }
  return list
}

export const remoteOkProvider: VacancySourceProvider = {
  id: "remoteok",
  name: "Remote OK",
  async search(q: string): Promise<SourceVacancy[]> {
    const all = await fetchAll()
    const query = q.trim().toLowerCase()
    if (!query) return all.slice(0, 50)
    return all
      .filter((j) =>
        [j.title, j.company, j.location ?? "", j.description ?? "", ...(j.tags ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 50)
  },
}
