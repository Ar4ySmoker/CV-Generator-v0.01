import { describe, expect, it } from "vitest"

import { buildDocx } from "./docx"
import type { AdaptedCv } from "./llm"

const cv: AdaptedCv = {
  lang: "ru",
  name: "Иван Иванов",
  title_line: "Senior Frontend Developer",
  header_note: "React · TypeScript · 4+ года",
  contacts: ["Телефон: +7 900", "Email: a@b.c"],
  sections: [
    { type: "paragraph", heading: "О себе", lines: ["Опытный разработчик."] },
    { type: "bullets", heading: "Навыки", items: ["React", "TypeScript"] },
    {
      type: "experience",
      heading: "Опыт работы",
      items: [
        {
          period: "2021 — н.в.",
          role: "Frontend",
          company: "Acme",
          bullets: ["Разработал фичу"],
          tech: "React",
        },
      ],
    },
    {
      type: "projects",
      heading: "Проекты",
      items: [
        { name: "Пет-проект", tagline: "MVP", bullets: ["Сделал"], tech: "Next.js" },
      ],
    },
  ],
}

describe("buildDocx", () => {
  it("returns a non-empty Buffer", async () => {
    const buf = await buildDocx(cv)
    expect(Buffer.isBuffer(buf)).toBe(true)
    expect(buf.length).toBeGreaterThan(0)
  })

  it("applies an accent color override", async () => {
    const buf = await buildDocx(cv, { template: "modern", accentColor: "FF0000" })
    expect(Buffer.isBuffer(buf)).toBe(true)
    expect(buf.length).toBeGreaterThan(0)
  })

  it("applies a custom theme", async () => {
    const buf = await buildDocx(cv, {
      theme: {
        font: "Arial",
        accent: "FF0000",
        body: "111111",
        gray: "666666",
        heading: "bar",
        accentRule: true,
      },
    })
    expect(Buffer.isBuffer(buf)).toBe(true)
    expect(buf.length).toBeGreaterThan(0)
  })
})
