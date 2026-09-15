export class VacancyUrlError extends Error {
  constructor(
    message: string,
    public readonly code: "blocked" | "unreachable" | "invalid"
  ) {
    super(message)
    this.name = "VacancyUrlError"
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
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

export function detectVacancyLang(text: string): "ru" | "en" {
  const cyrillic = (text.match(/[а-яё]/gi) ?? []).length
  const latin = (text.match(/[a-z]/gi) ?? []).length
  return cyrillic > latin ? "ru" : "en"
}

export async function fetchVacancyText(url: string): Promise<string> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new VacancyUrlError("Некорректный URL вакансии", "invalid")
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    throw new VacancyUrlError(
      "Поддерживаются только http/https ссылки",
      "invalid"
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    })

    if (res.status === 403 || res.status === 429 || res.status === 503) {
      throw new VacancyUrlError(
        "Сайт блокирует автоматический доступ. Вставьте текст вакансии вручную.",
        "blocked"
      )
    }

    if (!res.ok) {
      throw new VacancyUrlError(
        `Не удалось получить страницу (HTTP ${res.status}). Вставьте текст вакансии вручную.`,
        "unreachable"
      )
    }

    const contentType = res.headers.get("content-type") ?? ""
    const text = await res.text()

    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      throw new VacancyUrlError(
        "По ссылке нет текстовой страницы вакансии. Вставьте текст вручную.",
        "invalid"
      )
    }

    const cleaned = stripHtml(text)
    if (cleaned.length < 120) {
      throw new VacancyUrlError(
        "Не удалось извлечь текст вакансии со страницы. Вставьте текст вручную.",
        "blocked"
      )
    }

    return cleaned.slice(0, 20000)
  } catch (err) {
    if (err instanceof VacancyUrlError) {
      throw err
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new VacancyUrlError(
        "Сайт не ответил вовремя. Вставьте текст вакансии вручную.",
        "unreachable"
      )
    }
    throw new VacancyUrlError(
      "Не удалось загрузить страницу. Вставьте текст вакансии вручную.",
      "unreachable"
    )
  } finally {
    clearTimeout(timeout)
  }
}
