import { afterEach, describe, expect, it, vi } from "vitest"

import { remoteOkProvider } from "./remoteok"

afterEach(() => {
  vi.unstubAllGlobals()
})

const jobs = [
  { last_updated: 1, legal: "terms" },
  {
    id: 1,
    position: "Frontend Developer",
    company: "Acme",
    location: "Remote",
    salary_min: 50000,
    salary_max: 70000,
    url: "https://remoteok.com/job/1",
    description: "<p>React job</p>",
    tags: ["react"],
    date: "2026-01-01T00:00:00+00:00",
  },
  {
    id: 2,
    position: "Backend Developer",
    company: "Beta",
    location: "Remote",
    url: "https://remoteok.com/job/2",
    description: "<p>Node job</p>",
    tags: ["node"],
    date: "2026-01-02T00:00:00+00:00",
  },
]

describe("remoteOkProvider", () => {
  it("maps fields and filters by query", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => jobs })
    )
    const res = await remoteOkProvider.search("frontend", { remote: true })
    expect(res).toHaveLength(1)
    expect(res[0].title).toBe("Frontend Developer")
    expect(res[0].company).toBe("Acme")
    expect(res[0].currency).toBe("USD")
    expect(res[0].remote).toBe(true)
    expect(res[0].source).toBe("remoteok")
  })
})
