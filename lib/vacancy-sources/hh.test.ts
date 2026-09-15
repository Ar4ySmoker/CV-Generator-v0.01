import { afterEach, describe, expect, it, vi } from "vitest"

import { hhProvider } from "./hh"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("hhProvider", () => {
  it("maps hh.ru fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            {
              id: "1",
              name: "Frontend Developer",
              employer: { name: "Acme" },
              area: { name: "Москва" },
              salary: { from: 100000, to: 150000, currency: "RUR" },
              alternate_url: "https://hh.ru/vacancy/1",
              snippet: { requirement: "React", responsibility: "Фичи" },
              published_at: "2026-01-01T00:00:00+00:00",
            },
          ],
        }),
      })
    )
    const res = await hhProvider.search("frontend", { remote: true })
    expect(res).toHaveLength(1)
    expect(res[0].title).toBe("Frontend Developer")
    expect(res[0].company).toBe("Acme")
    expect(res[0].location).toBe("Москва")
    expect(res[0].currency).toBe("RUR")
    expect(res[0].source).toBe("hh")
  })

  it("throws on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }))
    await expect(hhProvider.search("x", { remote: true })).rejects.toThrow()
  })
})
