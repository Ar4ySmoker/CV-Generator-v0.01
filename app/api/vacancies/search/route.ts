import { NextResponse } from "next/server"

import { getUserId } from "@/lib/auth"
import { searchVacancies } from "@/lib/vacancy-sources"
import type { VacancySourceId } from "@/lib/vacancy-sources"

export const runtime = "nodejs"

const VALID_SOURCES: VacancySourceId[] = [
  "hh",
  "habr",
  "remoteok",
  "trudvsem",
  "jooble",
]

export async function GET(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const url = new URL(request.url)
  const q = url.searchParams.get("q") ?? ""
  const remote = url.searchParams.get("remote") !== "0"

  const sourceParam = url.searchParams.get("source")
  const sources = sourceParam
    ? (sourceParam
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is VacancySourceId =>
          VALID_SOURCES.includes(s as VacancySourceId)
        ))
    : undefined

  const result = await searchVacancies(q, { remote, sources })

  return NextResponse.json(result)
}
