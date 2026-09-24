import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { extractVacancyMeta } from "@/lib/llm"
import type { VacancyMeta } from "@/lib/llm"
import { resolveProvider } from "@/lib/resolve-provider"
import { fetchVacancyText } from "@/lib/vacancy"

export const runtime = "nodejs"

const parseSchema = z.object({
  text: z.string().trim().optional(),
  url: z.string().trim().optional(),
})

const EMPTY_META: VacancyMeta = { company: "", role: "" }

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 })
  }

  const parsed = parseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 })
  }

  let text = parsed.data.text?.trim() ?? ""

  if (!text && parsed.data.url?.trim()) {
    try {
      text = await fetchVacancyText(parsed.data.url)
    } catch {
      text = ""
    }
  }

  if (!text) {
    return NextResponse.json({ meta: EMPTY_META })
  }

  try {
    const provider = await resolveProvider(userId)
    const meta = await extractVacancyMeta(text, provider)
    return NextResponse.json({ meta })
  } catch {
    return NextResponse.json({ meta: EMPTY_META })
  }
}
