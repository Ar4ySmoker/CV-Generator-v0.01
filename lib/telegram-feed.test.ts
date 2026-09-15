import { afterEach, describe, expect, it, vi } from "vitest"

import { fetchChannelPosts, normalizeChannelUsername } from "./telegram-feed"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("normalizeChannelUsername", () => {
  it("strips @ prefix", () => {
    expect(normalizeChannelUsername("@remote_jobs")).toBe("remote_jobs")
  })

  it("strips t.me URL", () => {
    expect(normalizeChannelUsername("https://t.me/remote_jobs")).toBe(
      "remote_jobs"
    )
  })

  it("strips t.me/s/ URL", () => {
    expect(normalizeChannelUsername("t.me/s/for_geeks")).toBe("for_geeks")
  })

  it("keeps plain username", () => {
    expect(normalizeChannelUsername("remote_jobs")).toBe("remote_jobs")
  })
})

describe("fetchChannelPosts", () => {
  it("preserves <br> as newlines and extracts links", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => `
          <div class="tgme_widget_message">
            <div class="tgme_widget_message_text"><a href="https://hh.ru/vacancy/1">Младший маркетолог (Junior+)</a><br/>Line2 <a href="https://example.com">link</a></div>
            <a class="tgme_widget_message_date" href="https://t.me/ch/1"><time datetime="2026-01-01T10:00:00+00:00">1 Jan</time></a>
          </div>`,
      })
    )
    const posts = await fetchChannelPosts("ch", true)
    expect(posts).toHaveLength(1)
    expect(posts[0].text).toBe("Младший маркетолог (Junior+)\nLine2 link")
    expect(posts[0].url).toBe("https://t.me/ch/1")

    const linked = posts[0].segments.filter((s) => s.url)
    expect(linked.map((s) => s.url)).toEqual([
      "https://hh.ru/vacancy/1",
      "https://example.com",
    ])
    expect(linked[0].text).toBe("Младший маркетолог (Junior+)")
  })
})

