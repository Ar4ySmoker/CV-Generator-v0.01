import { afterEach, describe, expect, it, vi } from "vitest"

import { habrProvider } from "./habr"

afterEach(() => {
  vi.unstubAllGlobals()
})

const item = {
  id: 1000,
  href: "/vacancies/1000",
  title: "Frontend Developer",
  remoteWork: true,
  publishedDate: { date: "2026-01-01T00:00:00+03:00" },
  company: { title: "Acme" },
  locations: [{ title: "Москва" }],
  salary: null,
  predictedSalary: { from: 192000, to: 255000, currency: "rur" },
  skills: [{ title: "React" }, { title: "TypeScript" }],
}

describe("habrProvider", () => {
  it("maps fields and builds url", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ list: [item] }),
      })
    )
    const res = await habrProvider.search("frontend", { remote: true })
    expect(res).toHaveLength(1)
    expect(res[0].title).toBe("Frontend Developer")
    expect(res[0].company).toBe("Acme")
    expect(res[0].url).toBe("https://career.habr.com/vacancies/1000")
    expect(res[0].currency).toBe("RUR")
    expect(res[0].remote).toBe(true)
    expect(res[0].source).toBe("habr")
  })

  it("filters out non-remote when remote=true", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ list: [{ ...item, remoteWork: false }] }),
      })
    )
    const res = await habrProvider.search("frontend", { remote: true })
    expect(res).toHaveLength(0)
  })
})
