import { afterEach, describe, expect, it, vi } from "vitest"

import { joobleProvider } from "./jooble"

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.JOOBLE_API_KEY
  delete process.env.JOOBLE_LOCATION
})

describe("joobleProvider", () => {
  it("throws when key is missing", async () => {
    await expect(joobleProvider.search("x", { remote: false })).rejects.toThrow()
  })

  it("maps fields with a key set", async () => {
    process.env.JOOBLE_API_KEY = "testkey"
    process.env.JOOBLE_LOCATION = "Сербия"
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jobs: [
            {
              id: "1",
              title: "Frontend Developer",
              company: "Acme",
              location: "Belgrade",
              snippet: "React",
              link: "https://jooble.org/job/1",
              source: "jooble.org",
            },
          ],
        }),
      })
    )
    const res = await joobleProvider.search("frontend", { remote: false })
    expect(res).toHaveLength(1)
    expect(res[0].title).toBe("Frontend Developer")
    expect(res[0].source).toBe("jooble")
    expect(res[0].url).toBe("https://jooble.org/job/1")
  })
})
