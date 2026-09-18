import { describe, expect, it } from "vitest"

import { buildReferencePrompt, renderPrompt, type PromptContext } from "./prompt"

const ctx: PromptContext = {
  personal: { name: "Иван" },
  skills: [{ name: "React", level: "advanced" }],
  experience: [{ period: "2020—2024", role: "Dev", company: "Acme", bullets: ["Сделал"] }],
  education: [{ institution: "МГУ" }],
  projects: [{ name: "Pet" }],
  languages: [{ language: "Английский", level: "B2" }],
  vacancy: "React разработчик",
  mode: "with_experience",
}

describe("renderPrompt", () => {
  it("replaces placeholders", () => {
    const out = renderPrompt(
      "Имя: {{personal.name}}; Навыки: {{skills}}; Вакансия: {{vacancy}}",
      ctx
    )
    expect(out).toContain("Имя: Иван")
    expect(out).toContain("React (advanced)")
    expect(out).toContain("React разработчик")
  })

  it("leaves unknown placeholders untouched", () => {
    expect(renderPrompt("{{unknown}}", ctx)).toBe("{{unknown}}")
  })
})

describe("buildReferencePrompt", () => {
  it("contains placeholders and instructions", () => {
    const text = buildReferencePrompt()
    expect(text).toContain("{{personal.name}}")
    expect(text).toContain("{{vacancy}}")
    expect(text).toContain("ВАКАНСИЯ")
  })
})
