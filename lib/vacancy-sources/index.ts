import { hhProvider } from "./hh"
import { remoteOkProvider } from "./remoteok"
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
  const [remoteOk, hh] = await Promise.allSettled([
    remoteOkProvider.search(q, opts),
    hhProvider.search(q, opts),
  ])

  const results: SourceVacancy[] = []
  const sources: SourceStatus[] = []

  if (remoteOk.status === "fulfilled") {
    results.push(...remoteOk.value)
    sources.push({ id: "remoteok", name: "Remote OK", ok: true })
  } else {
    sources.push({
      id: "remoteok",
      name: "Remote OK",
      ok: false,
      error: errorMessage(remoteOk.reason),
    })
  }

  if (hh.status === "fulfilled") {
    results.push(...hh.value)
    sources.push({ id: "hh", name: "hh.ru", ok: true })
  } else {
    sources.push({
      id: "hh",
      name: "hh.ru",
      ok: false,
      error: errorMessage(hh.reason),
    })
  }

  return { results, sources }
}
