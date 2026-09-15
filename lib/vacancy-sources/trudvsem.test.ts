import { afterEach, describe, expect, it, vi } from "vitest"

import { trudvsemProvider } from "./trudvsem"

afterEach(() => {
  vi.unstubAllGlobals()
})

const vacancy = {
  id: "abc",
  "job-name": "Программист-разработчик",
  "vac_url": "https://trudvsem.ru/vacancy/card/1/abc",
  "creation-date": "2026-06-01",
  salary_min: 40000,
  salary_max: 40000,
  region: { name: "Свердловская область" },
  company: { name: "АО БАНК" },
  schedule: "Полный рабочий день",
  requirements: "Опыт от 3 лет",
  duty: "Разработка",
}

describe("trudvsemProvider", () => {
  it("maps fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: { vacancies: [{ vacancy }] } }),
      })
    )
    const res = await trudvsemProvider.search("разработчик", { remote: false })
    expect(res).toHaveLength(1)
    expect(res[0].title).toBe("Программист-разработчик")
    expect(res[0].company).toBe("АО БАНК")
    expect(res[0].currency).toBe("RUB")
    expect(res[0].remote).toBe(false)
    expect(res[0].source).toBe("trudvsem")
  })

  it("detects remote via schedule text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: {
            vacancies: [
              { vacancy: { ...vacancy, schedule: "Дистанционная работа" } },
            ],
          },
        }),
      })
    )
    const res = await trudvsemProvider.search("разработчик", { remote: true })
    expect(res).toHaveLength(1)
    expect(res[0].remote).toBe(true)
  })
})
