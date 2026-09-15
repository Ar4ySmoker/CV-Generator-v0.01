import { NextResponse } from "next/server"

import { getUserId } from "@/lib/auth"
import { searchVacancies } from "@/lib/vacancy-sources"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const url = new URL(request.url)
  const q = url.searchParams.get("q") ?? ""
  const remote = url.searchParams.get("remote") !== "0"

  const result = await searchVacancies(q, { remote })

  return NextResponse.json(result)
}
