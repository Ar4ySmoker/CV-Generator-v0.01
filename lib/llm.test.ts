import { afterEach, describe, expect, it, vi } from "vitest"

import { generateCv, parseCvFromText } from "./llm"
import type { GenerateRequest } from "./schemas"

const provider = { baseUrl: "https://mock.local", apiKey: "k", model: "m" }

function mockFetch(content: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content } }] }),
    })
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

const input: GenerateRequest = {
  mode: "with_experience",
  personal: {
    name: "Иван",
    phone: "",
    email: "",
    location: "",
    telegram: "",
    github: "",
    site: "",
  },
  skills: [{ name: "React", level: "intermediate" }],
  experience: [],
  education: [],
  projects: [],
  languages: [],
}

const validAdaptedCv = {
  lang: "ru",
  name: "Иван Иванов",
  title_line: "Разработчик",
  contacts: ["Телефон: +7"],
  sections: [{ type: "bullets", heading: "Навыки", items: ["React"] }],
}

describe("generateCv", () => {
  it("parses a valid LLM response", async () => {
    mockFetch(JSON.stringify(validAdaptedCv))
    const cv = await generateCv(input, provider)
    expect(cv.name).toBe("Иван Иванов")
    expect(cv.lang).toBe("ru")
    expect(cv.sections[0]?.heading).toBe("Навыки")
  })

  it("parses a valid response with length=one_page", async () => {
    mockFetch(JSON.stringify(validAdaptedCv))
    const cv = await generateCv({ ...input, length: "one_page" }, provider)
    expect(cv.name).toBe("Иван Иванов")
    expect(cv.sections[0]?.heading).toBe("Навыки")
  })

  it("injects a custom prompt into the LLM request", async () => {
    let captured: { messages: Array<{ role: string; content: string }> } | null = null
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (_url: string, init: { body: string }) => {
        captured = JSON.parse(init.body) as {
          messages: Array<{ role: string; content: string }>
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: JSON.stringify(validAdaptedCv) } }],
          }),
        }
      })
    )
    await generateCv({ ...input, customPrompt: "Пиши лаконично и без воды" }, provider)
    const req = captured as unknown as {
      messages: Array<{ role: string; content: string }>
    }
    expect(req.messages[1].content).toContain("Пиши лаконично и без воды")
    expect(req.messages[1].content).toContain("Данные кандидата")
  })

  it("throws on an invalid LLM response", async () => {
    mockFetch(JSON.stringify({ lang: "ru" }))
    await expect(generateCv(input, provider)).rejects.toThrow()
  })

  it("throws on malformed JSON", async () => {
    mockFetch("not json at all")
    await expect(generateCv(input, provider)).rejects.toThrow()
  })
})

describe("parseCvFromText", () => {
  const validParsed = {
    adaptedCv: validAdaptedCv,
    form: {
      personal: {
        name: "Иван Иванов",
        phone: "",
        email: "",
        location: "",
        telegram: "",
        github: "",
        site: "",
      },
      skills: [],
      experience: [],
      education: [],
      projects: [],
      languages: [],
    },
  }

  it("parses a valid response", async () => {
    mockFetch(JSON.stringify(validParsed))
    const parsed = await parseCvFromText("some text", provider)
    expect(parsed.adaptedCv.name).toBe("Иван Иванов")
    expect(parsed.form.personal.name).toBe("Иван Иванов")
  })

  it("throws on a missing form", async () => {
    mockFetch(JSON.stringify({ adaptedCv: validAdaptedCv }))
    await expect(parseCvFromText("some text", provider)).rejects.toThrow()
  })
})
