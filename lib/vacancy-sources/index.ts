import { habrProvider } from "./habr"
import { hhProvider } from "./hh"
import { joobleProvider } from "./jooble"
import { remoteOkProvider } from "./remoteok"
import { trudvsemProvider } from "./trudvsem"
import type {
  SearchOptions,
  SourceStatus,
  SourceVacancy,
  VacancySearchResult,
  VacancySourceId,
} from "./types"

export type {
  SearchOptions,
  SourceStatus,
  SourceVacancy,
  VacancySearchResult,
  VacancySourceId,
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "недоступен"
}

type Outcome = {
  id: VacancySourceId
  name: string
  ok: boolean
  value?: SourceVacancy[]
  error?: string
}

export async function searchVacancies(
  q: string,
  opts: SearchOptions
): Promise<VacancySearchResult> {
  const wanted = opts.sources

  const providers: {
    id: VacancySourceId
    name: string
    fn: (q: string, o: SearchOptions) => Promise<SourceVacancy[]>
  }[] = [
    { id: "remoteok", name: "Remote OK", fn: (q, o) => remoteOkProvider.search(q, o) },
    { id: "hh", name: "hh.ru", fn: (q, o) => hhProvider.search(q, o) },
    { id: "habr", name: "Хабр Карьера", fn: (q, o) => habrProvider.search(q, o) },
    { id: "trudvsem", name: "Работа России", fn: (q, o) => trudvsemProvider.search(q, o) },
  ]
  if (process.env.JOOBLE_API_KEY) {
    providers.push({
      id: "jooble",
      name: "Jooble",
      fn: (q, o) => joobleProvider.search(q, o),
    })
  }

  const outcomes = await Promise.all(
    providers.map(async (p): Promise<Outcome | null> => {
      if (wanted && !wanted.includes(p.id)) return null
      try {
        const value = await p.fn(q, opts)
        return { id: p.id, name: p.name, ok: true, value }
      } catch (err) {
        return { id: p.id, name: p.name, ok: false, error: errorMessage(err) }
      }
    })
  )

  const results: SourceVacancy[] = []
  const sources: SourceStatus[] = []

  for (const o of outcomes) {
    if (!o) continue
    if (o.ok) {
      results.push(...(o.value ?? []))
      sources.push({ id: o.id, name: o.name, ok: true })
    } else {
      sources.push({ id: o.id, name: o.name, ok: false, error: o.error })
    }
  }

  return { results, sources }
}
