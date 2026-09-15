import { describe, expect, it } from "vitest"

import { serializeVacancy } from "./vacancy-serialize"
import type { VacancyDoc } from "./models/vacancy"

const doc = {
  _id: { toString: () => "abc123" },
  company: "Яндекс",
  role: "Frontend",
  source: "manual",
  createdById: "u1",
  tags: [],
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
} as unknown as VacancyDoc

describe("serializeVacancy", () => {
  it("serializes core fields and nulls optional fields", () => {
    const v = serializeVacancy(doc)
    expect(v.id).toBe("abc123")
    expect(v.company).toBe("Яндекс")
    expect(v.country).toBeNull()
    expect(v.salaryMin).toBeNull()
    expect(v.tags).toEqual([])
    expect(v.source).toBe("manual")
  })
})
