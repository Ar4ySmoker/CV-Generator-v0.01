import { afterEach, describe, expect, it, vi } from "vitest"

import { extractVacancyMeta, generateCv, generateCvWithSelection, parseCvFromText } from "./llm"
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

describe("generateCvWithSelection", () => {
  const richInput: GenerateRequest = {
    ...input,
    skills: [
      { name: "React", level: "intermediate" },
      { name: "Сварка", level: "expert" },
    ],
    experience: [
      {
        period: "2020—2023",
        role: "Frontend",
        company: "A",
        bullets: [{ value: "React" }],
      },
      {
        period: "2015—2020",
        role: "Автослесарь",
        company: "B",
        bullets: [{ value: "Ремонт" }],
      },
    ],
    projects: [],
    education: [],
    languages: [],
    vacancy: { source: "text", text: "Нужен React-разработчик" },
  }

  it("selects a relevant subset before generating", async () => {
    const calls: string[] = []
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (_url: string, init: { body: string }) => {
        const body = JSON.parse(init.body) as {
          messages: Array<{ role: string; content: string }>
        }
        calls.push(body.messages[1].content)
        const content =
          calls.length === 1
            ? JSON.stringify({
                experience: [0],
                skills: [0],
                projects: [],
                education: [],
                languages: [],
              })
            : JSON.stringify(validAdaptedCv)
        return {
          ok: true,
          status: 200,
          json: async () => ({ choices: [{ message: { content } }] }),
        }
      })
    )
    const cv = await generateCvWithSelection(richInput, provider)
    expect(cv.name).toBe("Иван Иванов")
    expect(calls.length).toBe(2)
    expect(calls[1]).toContain("React")
    expect(calls[1]).not.toContain("Автослесарь")
    expect(calls[1]).not.toContain("Сварка")
  })

  it("skips selection when no vacancy is present", async () => {
    let count = 0
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        count += 1
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: JSON.stringify(validAdaptedCv) } }],
          }),
        }
      })
    )
    const cv = await generateCvWithSelection(input, provider)
    expect(cv.name).toBe("Иван Иванов")
    expect(count).toBe(1)
  })

  it("caps the subset to fit one page when length=one_page", async () => {
    const multi: GenerateRequest = {
      ...input,
      skills: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
        name: `Skill${i}`,
        level: "intermediate",
      })),
      experience: [0, 1, 2, 3].map((i) => ({
        period: "2020",
        role: `Role${i}`,
        company: "C",
        bullets: [{ value: "b" }],
      })),
      projects: [],
      education: [],
      languages: [],
      vacancy: { source: "text", text: "Вакансия" },
      length: "one_page",
    }
    const calls: string[] = []
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (_url: string, init: { body: string }) => {
        const body = JSON.parse(init.body) as {
          messages: Array<{ role: string; content: string }>
        }
        calls.push(body.messages[1].content)
        const content =
          calls.length === 1
            ? JSON.stringify({
                experience: [0, 1, 2, 3],
                skills: [0, 1, 2, 3, 4, 5, 6, 7],
                projects: [],
                education: [],
                languages: [],
              })
            : JSON.stringify(validAdaptedCv)
        return {
          ok: true,
          status: 200,
          json: async () => ({ choices: [{ message: { content } }] }),
        }
      })
    )
    await generateCvWithSelection(multi, provider)
    expect(calls.length).toBe(2)
    expect(calls[1]).toContain("Role0")
    expect(calls[1]).toContain("Role1")
    expect(calls[1]).not.toContain("Role2")
    expect(calls[1]).not.toContain("Role3")
    expect(calls[1]).not.toContain("Skill6")
    expect(calls[1]).not.toContain("Skill7")
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

describe("extractVacancyMeta", () => {
  const validMeta = {
    company: "Aston",
    role: "Frontend Developer",
    country: "Москва",
    salaryMin: 100000,
    salaryMax: 150000,
    currency: "RUB",
  }

  it("parses a valid response", async () => {
    mockFetch(JSON.stringify(validMeta))
    const meta = await extractVacancyMeta("текст вакансии", provider)
    expect(meta.company).toBe("Aston")
    expect(meta.role).toBe("Frontend Developer")
    expect(meta.salaryMin).toBe(100000)
    expect(meta.currency).toBe("RUB")
  })

  it("accepts missing optional fields", async () => {
    mockFetch(JSON.stringify({ company: "Aston", role: "Dev" }))
    const meta = await extractVacancyMeta("текст", provider)
    expect(meta.company).toBe("Aston")
    expect(meta.country).toBeUndefined()
  })

  it("throws on invalid response", async () => {
    mockFetch(JSON.stringify({ salaryMin: "не число" }))
    await expect(extractVacancyMeta("текст", provider)).rejects.toThrow()
  })
})
