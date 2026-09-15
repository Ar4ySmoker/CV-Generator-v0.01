import { habrProvider } from "./habr"
import { hhProvider } from "./hh"
import { remoteOkProvider } from "./remoteok"
import { trudvsemProvider } from "./trudvsem"
import type {
  SearchOptions,
  SourceStatus,
  SourceVacancy,
  VacancySearchResult,
} from "./types"

export type { SourceVacancy, VacancySearchResult, SourceStatus, SearchOptions }

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "недоступен"
}

export async function searchVacancies(
  q: string,
  opts: SearchOptions
): Promise<VacancySearchResult> {
  const [remoteOk, hh, habr, trudvsem] = await Promise.allSettled([
    remoteOkProvider.search(q, opts),
    hhProvider.search(q, opts),
    habrProvider.search(q, opts),
    trudvsemProvider.search(q, opts),
  ])

  const results: SourceVacancy[] = []
  const sources: SourceStatus[] = []

  const collect = (
    outcome: PromiseSettledResult<SourceVacancy[]>,
    id: SourceStatus["id"],
    name: string
  ) => {
    if (outcome.status === "fulfilled") {
      results.push(...outcome.value)
      sources.push({ id, name, ok: true })
    } else {
      sources.push({ id, name, ok: false, error: errorMessage(outcome.reason) })
    }
  }

  collect(remoteOk, "remoteok", "Remote OK")
  collect(hh, "hh", "hh.ru")
  collect(habr, "habr", "Хабр Карьера")
  collect(trudvsem, "trudvsem", "Работа России")

  return { results, sources }
}
